from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.database import get_supabase
from app.models.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductSearch,
    ProductStatus,
)
from app.models.order import (
    OrderCreate, OrderResponse, OrderStatusUpdate,
    OrderItemStatusUpdate, OrderStatus, OrderItemStatus,
)
from app.auth.middleware import (
    get_current_user, require_farmer, require_buyer, UserPayload,
)

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


# ─── Product Listings ────────────────────────────────────────────────────────

@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_listing(
    data: ProductCreate,
    user: UserPayload = Depends(require_farmer),
):
    """Create a new produce listing."""
    sb = get_supabase()
    
    product_data = {
        "seller_id": user.id,
        "crop_name": data.crop_name,
        "variety": data.variety,
        "grade": data.grade.value,
        "quantity_kg": data.quantity_kg,
        "unit_price": data.unit_price,
        "harvest_date": data.harvest_date.isoformat(),
        "shelf_life_days": data.shelf_life_days,
        "district": data.district,
        "state": data.state,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "status": "active",
    }
    
    result = sb.table("products").insert(product_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create listing")
    
    product = result.data[0]
    return _product_to_response(product)


@router.get("/products", response_model=list[ProductResponse])
async def search_products(
    crop_name: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_quantity: Optional[float] = Query(None),
    grade: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    user: UserPayload = Depends(get_current_user),
):
    """Search and filter produce listings."""
    sb = get_supabase()
    
    query = sb.table("products").select("*").eq("status", "active")
    
    if crop_name:
        query = query.ilike("crop_name", f"%{crop_name}%")
    if district:
        query = query.eq("district", district)
    if state:
        query = query.eq("state", state)
    if min_price is not None:
        query = query.gte("unit_price", min_price)
    if max_price is not None:
        query = query.lte("unit_price", max_price)
    if min_quantity is not None:
        query = query.gte("quantity_kg", min_quantity)
    if grade:
        query = query.eq("grade", grade)
    
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    
    products = []
    for p in (result.data or []):
        products.append(_product_to_response(p))
    
    return products


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    user: UserPayload = Depends(get_current_user),
):
    """Get a single product listing by ID."""
    sb = get_supabase()
    
    result = sb.table("products").select("*").eq("id", product_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return _product_to_response(result.data[0])


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_listing(
    product_id: str,
    data: ProductUpdate,
    user: UserPayload = Depends(require_farmer),
):
    """Update a product listing (owner only)."""
    sb = get_supabase()
    
    # Verify ownership
    existing = sb.table("products").select("*").eq("id", product_id).execute()
    if not existing.data or existing.data[0]["seller_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if "grade" in update_dict:
        update_dict["grade"] = update_dict["grade"].value if hasattr(update_dict["grade"], "value") else update_dict["grade"]
    if "status" in update_dict:
        update_dict["status"] = update_dict["status"].value if hasattr(update_dict["status"], "value") else update_dict["status"]
    
    if update_dict:
        sb.table("products").update(update_dict).eq("id", product_id).execute()
    
    result = sb.table("products").select("*").eq("id", product_id).execute()
    return _product_to_response(result.data[0])


@router.delete("/products/{product_id}")
async def delete_listing(
    product_id: str,
    user: UserPayload = Depends(require_farmer),
):
    """Soft-delete a product listing (set status to expired)."""
    sb = get_supabase()
    
    existing = sb.table("products").select("*").eq("id", product_id).execute()
    if not existing.data or existing.data[0]["seller_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sb.table("products").update({"status": "expired"}).eq("id", product_id).execute()
    
    return {"message": "Listing removed"}


@router.get("/my-listings", response_model=list[ProductResponse])
async def my_listings(
    user: UserPayload = Depends(require_farmer),
):
    """Get all listings by the current farmer."""
    sb = get_supabase()
    
    result = (
        sb.table("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    
    return [_product_to_response(p) for p in (result.data or [])]


# ─── Orders ──────────────────────────────────────────────────────────────────

@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    data: OrderCreate,
    user: UserPayload = Depends(require_buyer),
):
    """Create a new order."""
    sb = get_supabase()
    
    # Calculate total and validate products
    total = 0.0
    order_items = []
    
    for item in data.items:
        product_resp = sb.table("products").select("*").eq("id", item.product_id).execute()
        if not product_resp.data:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        product = product_resp.data[0]
        if product["quantity_kg"] < item.quantity_kg:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient quantity for {product['crop_name']}",
            )
        
        item_total = product["unit_price"] * item.quantity_kg
        total += item_total
        
        order_items.append({
            "product_id": item.product_id,
            "quantity_kg": item.quantity_kg,
            "price_per_kg": product["unit_price"],
            "farmer_id": product["seller_id"],
            "status": "pending",
        })
    
    order_data = {
        "buyer_id": user.id,
        "order_type": data.order_type.value,
        "total_amount": round(total, 2),
        "status": "pending",
        "delivery_address": data.delivery_address,
        "delivery_date": data.delivery_date.isoformat() if data.delivery_date else None,
    }
    
    order_result = sb.table("orders").insert(order_data).execute()
    if not order_result.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
    
    order = order_result.data[0]
    
    # Insert order items
    for item in order_items:
        item["order_id"] = order["id"]
        sb.table("order_items").insert(item).execute()
    
    # Reduce product quantities
    for item in data.items:
        product = sb.table("products").select("quantity_kg").eq("id", item.product_id).execute().data[0]
        new_qty = product["quantity_kg"] - item.quantity_kg
        new_status = "sold" if new_qty <= 0 else "active"
        sb.table("products").update({
            "quantity_kg": max(0, new_qty),
            "status": new_status,
        }).eq("id", item.product_id).execute()
    
    return _order_to_response(order, order_items)


@router.get("/orders", response_model=list[OrderResponse])
async def my_orders(
    user: UserPayload = Depends(get_current_user),
):
    """Get orders for the current user (as buyer or seller)."""
    sb = get_supabase()
    
    if user.role in ("buyer", "consumer"):
        result = sb.table("orders").select("*").eq("buyer_id", user.id).order("created_at", desc=True).execute()
    elif user.role in ("farmer", "fpo"):
        # Get orders that contain this farmer's products
        items = sb.table("order_items").select("order_id").eq("farmer_id", user.id).execute()
        order_ids = list(set(i["order_id"] for i in (items.data or [])))
        if not order_ids:
            return []
        result = sb.table("orders").select("*").in_("id", order_ids).order("created_at", desc=True).execute()
    else:
        result = sb.table("orders").select("*").order("created_at", desc=True).execute()
    
    orders = []
    for o in (result.data or []):
        items_result = sb.table("order_items").select("*").eq("order_id", o["id"]).execute()
        orders.append(_order_to_response(o, items_result.data or []))
    
    return orders


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: UserPayload = Depends(get_current_user),
):
    """Get a specific order by ID."""
    sb = get_supabase()
    
    result = sb.table("orders").select("*").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items_result = sb.table("order_items").select("*").eq("order_id", order_id).execute()
    return _order_to_response(result.data[0], items_result.data or [])


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    user: UserPayload = Depends(get_current_user),
):
    """Update order status."""
    sb = get_supabase()
    
    sb.table("orders").update({"status": data.status.value}).eq("id", order_id).execute()
    
    return {"message": f"Order status updated to {data.status.value}"}


@router.put("/orders/{order_id}/items/{item_id}/status")
async def update_order_item_status(
    order_id: str,
    item_id: str,
    data: OrderItemStatusUpdate,
    user: UserPayload = Depends(require_farmer),
):
    """Farmer accepts or rejects an order item."""
    sb = get_supabase()
    
    existing = sb.table("order_items").select("*").eq("id", item_id).execute()
    if not existing.data or existing.data[0]["farmer_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sb.table("order_items").update({"status": data.status.value}).eq("id", item_id).execute()
    
    return {"message": f"Item status updated to {data.status.value}"}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _product_to_response(product: dict) -> ProductResponse:
    harvest_date = product.get("harvest_date")
    if not harvest_date:
        from datetime import date
        harvest_date = date.today()
    return ProductResponse(
        id=product["id"],
        seller_id=product.get("seller_id", ""),
        crop_name=product.get("crop_name", ""),
        variety=product.get("variety"),
        grade=product.get("grade", "B"),
        quantity_kg=product.get("quantity_kg", 0),
        unit_price=product.get("unit_price", 0),
        harvest_date=harvest_date,
        shelf_life_days=product.get("shelf_life_days", 7),
        district=product.get("district", ""),
        state=product.get("state", ""),
        latitude=product.get("latitude"),
        longitude=product.get("longitude"),
        images=product.get("images", []),
        status=product.get("status", "active"),
        created_at=product.get("created_at"),
    )


def _order_to_response(order: dict, items: list) -> OrderResponse:
    return OrderResponse(
        id=order["id"],
        buyer_id=order.get("buyer_id", ""),
        order_type=order.get("order_type", "retail"),
        items=[
            {
                "id": i["id"],
                "product_id": i["product_id"],
                "quantity_kg": i["quantity_kg"],
                "price_per_kg": i["price_per_kg"],
                "farmer_id": i["farmer_id"],
                "status": i.get("status", "pending"),
            }
            for i in items
        ],
        total_amount=order.get("total_amount", 0),
        status=order.get("status", "pending"),
        delivery_address=order.get("delivery_address", ""),
        delivery_date=order.get("delivery_date"),
        created_at=order.get("created_at"),
    )
