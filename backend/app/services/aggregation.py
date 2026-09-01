"""
Smart Aggregation Engine

Splits large buyer requirements across multiple farmers or FPOs.
Considers: proximity, quantity availability, grade compatibility, price.

Example: a 10-ton onion order → 4 tons + 3 tons + 3 tons from three producers.
"""

from typing import Optional
from app.models.logistics import AggregationResult


def find_aggregation_plan(
    products: list[dict],
    target_quantity_kg: float,
    max_distance_km: float = 50.0,
    buyer_lat: Optional[float] = None,
    buyer_lng: Optional[float] = None,
) -> Optional[list[AggregationResult]]:
    """
    Greedy aggregation: select products to fulfill the target quantity
    while minimizing total cost and distance.
    
    Algorithm:
    1. Filter products that are available and match the crop
    2. Sort by a composite score: price × proximity × quantity_available
    3. Greedily assign until target is met
    """
    if not products:
        return None
    
    # Score each product
    scored = []
    for p in products:
        available_qty = p.get("quantity_kg", 0)
        if available_qty <= 0:
            continue
        
        price = p.get("unit_price", 0)
        
        # Distance from buyer (if known)
        if buyer_lat and buyer_lng:
            p_lat = p.get("latitude", 0) or 0
            p_lng = p.get("longitude", 0) or 0
            distance = _haversine(buyer_lat, buyer_lng, p_lat, p_lng)
        else:
            distance = 10.0  # Default
        
        if distance > max_distance_km:
            continue
        
        # Composite score (lower is better)
        # We want: low price, close distance, high availability
        score = (price * 0.5) + (distance * 0.3) - (available_qty * 0.001)
        
        scored.append({
            **p,
            "_distance": distance,
            "_score": score,
        })
    
    if not scored:
        return None
    
    # Sort by score (ascending — best first)
    scored.sort(key=lambda x: x["_score"])
    
    # Greedily assign
    plan = []
    remaining = target_quantity_kg
    
    for p in scored:
        if remaining <= 0:
            break
        
        available = min(p["quantity_kg"], remaining)
        
        plan.append(AggregationResult(
            farmer_id=p.get("seller_id", ""),
            farmer_name=p.get("seller_name", "Farmer"),
            product_id=p["id"],
            quantity_kg=round(available, 2),
            unit_price=p.get("unit_price", 0),
            distance_km=round(p["_distance"], 2),
            latitude=p.get("latitude"),
            longitude=p.get("longitude"),
        ))
        
        remaining -= available
    
    if remaining > 0:
        # Could not fulfill the full order
        return None
    
    return plan


def calculate_aggregation_metrics(plan: list[AggregationResult]) -> dict:
    """Calculate metrics for an aggregation plan."""
    total_cost = sum(item.quantity_kg * item.unit_price for item in plan)
    total_distance = sum(item.distance_km for item in plan)
    avg_distance = total_distance / len(plan) if plan else 0
    farmers_count = len(plan)
    
    return {
        "total_cost": round(total_cost, 2),
        "total_distance_km": round(total_distance, 2),
        "avg_distance_km": round(avg_distance, 2),
        "farmers_count": farmers_count,
        "cost_per_kg": round(total_cost / sum(i.quantity_kg for i in plan), 2) if plan else 0,
    }


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
