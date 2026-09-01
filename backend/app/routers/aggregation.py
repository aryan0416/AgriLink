from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.models.logistics import AggregationRequest, AggregationResult
from app.auth.middleware import get_current_user, UserPayload
from app.services.aggregation import find_aggregation_plan

router = APIRouter(prefix="/api/aggregation", tags=["aggregation"])


@router.post("/plan", response_model=list[AggregationResult])
async def plan_aggregation(
    data: AggregationRequest,
    user: UserPayload = Depends(get_current_user),
):
    """
    Given a bulk order requirement, find the best combination of
    farmers/FPOs to fulfill it.
    
    The engine considers:
    - Available listings matching the crop
    - Proximity to delivery location
    - Quantity availability
    - Grade compatibility
    - Price optimization
    """
    sb = get_supabase()
    
    # Find matching active products
    query = (
        sb.table("products")
        .select("*")
        .eq("status", "active")
        .ilike("crop_name", f"%{data.crop_name}%")
    )
    
    if data.district:
        query = query.eq("district", data.district)
    if data.state:
        query = query.eq("state", data.state)
    if data.grade_requirement:
        query = query.eq("grade", data.grade_requirement)
    
    result = query.execute()
    products = result.data or []
    
    if not products:
        raise HTTPException(
            status_code=404,
            detail=f"No available listings found for {data.crop_name}",
        )
    
    # Run aggregation algorithm
    plan = find_aggregation_plan(
        products=products,
        target_quantity_kg=data.total_quantity_kg,
        max_distance_km=data.max_distance_km,
        buyer_lat=None,
        buyer_lng=None,
    )
    
    if plan is None:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot fulfill {data.total_quantity_kg}kg of {data.crop_name} with current supply",
        )
    
    return plan


@router.post("/execute")
async def execute_aggregation(
    crop_name: str,
    total_quantity_kg: float,
    delivery_address: str,
    buyer_lat: float = 0,
    buyer_lng: float = 0,
    user: UserPayload = Depends(get_current_user),
):
    """
    Execute an aggregation plan: create order items across
    multiple farmers for a bulk order.
    """
    sb = get_supabase()
    
    # First, get the plan
    plan_req = AggregationRequest(
        crop_name=crop_name,
        total_quantity_kg=total_quantity_kg,
    )
    
    plan = await plan_aggregation(plan_req, user)
    
    if not plan:
        raise HTTPException(status_code=400, detail="No valid aggregation plan found")
    
    # Create the order
    total_cost = sum(item.quantity_kg * item.unit_price for item in plan)
    
    order_data = {
        "buyer_id": user.id,
        "order_type": "bulk",
        "total_amount": round(total_cost, 2),
        "status": "aggregating",
        "delivery_address": delivery_address,
    }
    
    order_result = sb.table("orders").insert(order_data).execute()
    if not order_result.data:
        raise HTTPException(status_code=500, detail="Failed to create aggregated order")
    
    order = order_result.data[0]
    
    # Create order items
    for item in plan:
        sb.table("order_items").insert({
            "order_id": order["id"],
            "product_id": item.product_id,
            "quantity_kg": item.quantity_kg,
            "price_per_kg": item.unit_price,
            "farmer_id": item.farmer_id,
            "status": "pending",
        }).execute()
    
    return {
        "order_id": order["id"],
        "total_amount": total_cost,
        "farmers_count": len(plan),
        "items": [item.model_dump() for item in plan],
    }
