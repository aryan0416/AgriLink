from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_supabase
from app.models.logistics import (
    VehicleCreate, VehicleUpdate, VehicleResponse,
    ShipmentCreate, ShipmentResponse, RouteOptimizeRequest, PickupPoint,
    ShipmentStatus, VehicleType,
)
from app.auth.middleware import (
    get_current_user, require_transporter, UserPayload,
)
from app.services.route_optimizer import optimize_route

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


# ─── Vehicles ────────────────────────────────────────────────────────────────

@router.post("/vehicles", response_model=VehicleResponse, status_code=201)
async def register_vehicle(
    data: VehicleCreate,
    user: UserPayload = Depends(require_transporter),
):
    """Register a new vehicle."""
    sb = get_supabase()
    
    vehicle_data = {
        "transporter_id": user.id,
        "vehicle_type": data.vehicle_type.value,
        "capacity_kg": data.capacity_kg,
        "registration_no": data.registration_no,
        "available": True,
    }
    
    if data.latitude and data.longitude:
        vehicle_data["latitude"] = data.latitude
        vehicle_data["longitude"] = data.longitude
    
    result = sb.table("vehicles").insert(vehicle_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register vehicle")
    
    return _vehicle_to_response(result.data[0])


@router.get("/vehicles", response_model=list[VehicleResponse])
async def my_vehicles(user: UserPayload = Depends(require_transporter)):
    """Get all vehicles for the current transporter."""
    sb = get_supabase()
    result = sb.table("vehicles").select("*").eq("transporter_id", user.id).execute()
    return [_vehicle_to_response(v) for v in (result.data or [])]


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: str,
    data: VehicleUpdate,
    user: UserPayload = Depends(require_transporter),
):
    """Update a vehicle's details or availability."""
    sb = get_supabase()
    
    existing = sb.table("vehicles").select("*").eq("id", vehicle_id).execute()
    if not existing.data or existing.data[0]["transporter_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if "vehicle_type" in update_dict:
        update_dict["vehicle_type"] = update_dict["vehicle_type"].value
    if "latitude" in update_dict and "longitude" in update_dict:
        pass  # handled
    
    if update_dict:
        sb.table("vehicles").update(update_dict).eq("id", vehicle_id).execute()
    
    result = sb.table("vehicles").select("*").eq("id", vehicle_id).execute()
    return _vehicle_to_response(result.data[0])


@router.post("/vehicles/{vehicle_id}/toggle-availability")
async def toggle_availability(
    vehicle_id: str,
    user: UserPayload = Depends(require_transporter),
):
    """Toggle vehicle online/offline status."""
    sb = get_supabase()
    
    existing = sb.table("vehicles").select("*").eq("id", vehicle_id).execute()
    if not existing.data or existing.data[0]["transporter_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    current = existing.data[0]["available"]
    sb.table("vehicles").update({"available": not current}).eq("id", vehicle_id).execute()
    
    return {"available": not current}


# ─── Available Vehicles (for order assignment) ───────────────────────────────

@router.get("/available-vehicles", response_model=list[VehicleResponse])
async def find_available_vehicles(
    min_capacity_kg: float = 0,
    vehicle_type: str = None,
    user: UserPayload = Depends(get_current_user),
):
    """Find available vehicles that could fulfill a shipment."""
    sb = get_supabase()
    
    query = sb.table("vehicles").select("*").eq("available", True)
    if min_capacity_kg > 0:
        query = query.gte("capacity_kg", min_capacity_kg)
    if vehicle_type:
        query = query.eq("vehicle_type", vehicle_type)
    
    result = query.execute()
    return [_vehicle_to_response(v) for v in (result.data or [])]


# ─── Shipments ───────────────────────────────────────────────────────────────

@router.post("/shipments", response_model=ShipmentResponse, status_code=201)
async def create_shipment(
    data: ShipmentCreate,
    user: UserPayload = Depends(get_current_user),
):
    """Create a shipment with route optimization."""
    sb = get_supabase()
    
    # Verify order exists
    order = sb.table("orders").select("*").eq("id", data.order_id).execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify vehicle exists and is available
    vehicle = sb.table("vehicles").select("*").eq("id", data.vehicle_id).execute()
    if not vehicle.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not vehicle.data[0]["available"]:
        raise HTTPException(status_code=400, detail="Vehicle is not available")
    
    # Determine delivery coordinates from order or buyer profile
    delivery_lat = order.data[0].get("delivery_lat") or 0
    delivery_lng = order.data[0].get("delivery_lng") or 0
    if not (delivery_lat and delivery_lng) and order.data[0].get("buyer_id"):
        buyer_profile = sb.table("profiles").select("latitude, longitude").eq("id", order.data[0]["buyer_id"]).execute()
        if buyer_profile.data:
            delivery_lat = buyer_profile.data[0].get("latitude") or 0
            delivery_lng = buyer_profile.data[0].get("longitude") or 0

    # Optimize route
    route_info = await optimize_route(
        pickup_points=data.pickup_points,
        delivery_lat=delivery_lat,
        delivery_lng=delivery_lng,
    )
    
    # Calculate cost (simple: ₹15/km)
    cost = route_info.distance_km * 15.0
    
    shipment_data = {
        "order_id": data.order_id,
        "vehicle_id": data.vehicle_id,
        "pickup_points": [p.model_dump() for p in data.pickup_points],
        "route": route_info.model_dump(),
        "status": "assigned",
        "distance_km": route_info.distance_km,
        "cost": round(cost, 2),
    }
    
    result = sb.table("shipments").insert(shipment_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create shipment")
    
    # Mark vehicle as unavailable
    sb.table("vehicles").update({"available": False}).eq("id", data.vehicle_id).execute()
    
    shipment = result.data[0]
    return _shipment_to_response(shipment, vehicle.data[0])


@router.get("/shipments", response_model=list[ShipmentResponse])
async def my_shipments(user: UserPayload = Depends(get_current_user)):
    """Get shipments for the current user."""
    sb = get_supabase()
    
    if user.role == "transporter":
        vehicles = sb.table("vehicles").select("id").eq("transporter_id", user.id).execute()
        vehicle_ids = [v["id"] for v in (vehicles.data or [])]
        if not vehicle_ids:
            return []
        result = sb.table("shipments").select("*").in_("vehicle_id", vehicle_ids).order("created_at", desc=True).execute()
    elif user.role in ("buyer", "consumer"):
        orders = sb.table("orders").select("id").eq("buyer_id", user.id).execute()
        order_ids = [o["id"] for o in (orders.data or [])]
        if not order_ids:
            return []
        result = sb.table("shipments").select("*").in_("order_id", order_ids).order("created_at", desc=True).execute()
    else:
        result = sb.table("shipments").select("*").order("created_at", desc=True).execute()
    
    shipments = []
    for s in (result.data or []):
        vehicle = sb.table("vehicles").select("*").eq("id", s.get("vehicle_id", "")).execute()
        v = vehicle.data[0] if vehicle.data else {}
        shipments.append(_shipment_to_response(s, v))
    
    return shipments


@router.put("/shipments/{shipment_id}/status")
async def update_shipment_status(
    shipment_id: str,
    status_val: ShipmentStatus,
    user: UserPayload = Depends(get_current_user),
):
    """Update shipment status."""
    sb = get_supabase()
    
    update = {"status": status_val.value}
    
    if status_val == ShipmentStatus.DELIVERED:
        from datetime import datetime
        update["actual_delivery"] = datetime.utcnow().isoformat()
    
    sb.table("shipments").update(update).eq("id", shipment_id).execute()
    
    # If delivered, free up the vehicle
    if status_val == ShipmentStatus.DELIVERED:
        shipment = sb.table("shipments").select("vehicle_id").eq("id", shipment_id).execute()
        if shipment.data:
            sb.table("vehicles").update({"available": True}).eq("id", shipment.data[0]["vehicle_id"]).execute()
    
    return {"message": f"Shipment status updated to {status_val.value}"}


# ─── Route Optimization ──────────────────────────────────────────────────────

@router.post("/optimize-route")
async def get_optimized_route(
    data: RouteOptimizeRequest,
    user: UserPayload = Depends(get_current_user),
):
    """Get an optimized route for multiple pickup points."""
    route = await optimize_route(
        pickup_points=data.pickup_points,
        delivery_lat=data.delivery_lat,
        delivery_lng=data.delivery_lng,
    )
    return route


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _vehicle_to_response(vehicle: dict) -> VehicleResponse:
    return VehicleResponse(
        id=vehicle["id"],
        transporter_id=vehicle.get("transporter_id", ""),
        vehicle_type=vehicle.get("vehicle_type", "truck"),
        capacity_kg=vehicle.get("capacity_kg", 0),
        registration_no=vehicle.get("registration_no", ""),
        available=vehicle.get("available", True),
        latitude=vehicle.get("latitude"),
        longitude=vehicle.get("longitude"),
    )


def _shipment_to_response(shipment: dict, vehicle: dict) -> ShipmentResponse:
    pickup_points = shipment.get("pickup_points", [])
    if isinstance(pickup_points, str):
        import json
        pickup_points = json.loads(pickup_points)
    
    route_data = shipment.get("route", {})
    if isinstance(route_data, str):
        import json
        route_data = json.loads(route_data)
    
    return ShipmentResponse(
        id=shipment["id"],
        order_id=shipment.get("order_id", ""),
        vehicle_id=shipment.get("vehicle_id", ""),
        vehicle_type=vehicle.get("vehicle_type"),
        pickup_points=[PickupPoint(**p) for p in pickup_points],
        route=route_data,
        status=shipment.get("status", "assigned"),
        eta=shipment.get("eta"),
        actual_delivery=shipment.get("actual_delivery"),
        distance_km=shipment.get("distance_km"),
        cost=shipment.get("cost"),
        created_at=shipment.get("created_at"),
    )
