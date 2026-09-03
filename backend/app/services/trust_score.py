"""
AgriTrust Score Service

Creates a performance profile based on:
- Fulfillment rate (40%)
- Delivery timeliness (30%)
- Product quality average (20%)
- Total transactions (10%)

Tiers: Gold (80+), Silver (60-79), Bronze (40-59), New (<40)
"""

from app.database import get_supabase
from app.models.analytics import TrustScore


async def compute_trust_score(user_id: str) -> TrustScore:
    """Compute the AgriTrust score for a user from their transaction history."""
    sb = get_supabase()
    
    # Fetch user profile
    profile = sb.table("profiles").select("role").eq("id", user_id).execute()
    role = profile.data[0].get("role", "farmer") if profile.data else "farmer"
    
    if role in ("farmer", "fpo"):
        return _compute_farmer_trust(user_id)
    elif role == "transporter":
        return _compute_transporter_trust(user_id)
    elif role in ("buyer", "consumer"):
        return _compute_buyer_trust(user_id)
    else:
        return TrustScore(
            user_id=user_id,
            fulfillment_rate=0,
            delivery_timeliness=0,
            quality_avg=0,
            total_transactions=0,
            score=0,
            tier="New",
        )


def _compute_farmer_trust(user_id: str) -> TrustScore:
    """Compute trust for a farmer based on their product fulfillment."""
    sb = get_supabase()
    
    # Get all order items from this farmer
    items = sb.table("order_items").select("status, order_id").eq("farmer_id", user_id).execute()
    all_items = items.data or []
    
    total = len(all_items)
    if total == 0:
        return TrustScore(
            user_id=user_id,
            fulfillment_rate=0,
            delivery_timeliness=0,
            quality_avg=0,
            total_transactions=0,
            score=0,
            tier="New",
        )
    
    fulfilled = sum(1 for i in all_items if i.get("status") == "fulfilled")
    fulfillment_rate = fulfilled / total
    
    # Delivery timeliness (from completed orders)
    order_ids = list(set(i.get("order_id") for i in all_items if i.get("status") == "fulfilled"))
    timely_count = 0
    if order_ids:
        orders = sb.table("orders").select("delivery_date, created_at, status").in_("id", order_ids).execute()
        for o in (orders.data or []):
            if o.get("status") == "delivered":
                timely_count += 1
        delivery_timeliness = timely_count / len(order_ids) if order_ids else 0
    else:
        delivery_timeliness = 0
    
    # Quality average from quality assessments of farmer's products
    farmer_prods = sb.table("products").select("id").eq("seller_id", user_id).execute()
    prod_ids = [p["id"] for p in (farmer_prods.data or [])]
    grade_scores = {"A": 1.0, "B": 0.7, "C": 0.4}
    
    if prod_ids:
        assessments = sb.table("quality_assessments").select("grade").in_("product_id", prod_ids).execute()
        user_assessments = assessments.data or []
        if user_assessments:
            quality_avg = sum(grade_scores.get(a.get("grade", "B"), 0.7) for a in user_assessments) / len(user_assessments)
        else:
            quality_avg = 0.7
    else:
        quality_avg = 0.7  # Default
    
    # Weighted score
    score = (
        fulfillment_rate * 40 +
        delivery_timeliness * 30 +
        quality_avg * 20 +
        min(total / 10, 1.0) * 10
    )
    
    score = round(min(100, score), 1)
    
    return TrustScore(
        user_id=user_id,
        fulfillment_rate=round(fulfillment_rate, 3),
        delivery_timeliness=round(delivery_timeliness, 3),
        quality_avg=round(quality_avg, 3),
        total_transactions=total,
        score=score,
        tier=_score_to_tier(score),
    )


def _compute_transporter_trust(user_id: str) -> TrustScore:
    """Compute trust for a transporter."""
    sb = get_supabase()
    
    vehicles = sb.table("vehicles").select("id").eq("transporter_id", user_id).execute()
    vehicle_ids = [v["id"] for v in (vehicles.data or [])]
    
    if not vehicle_ids:
        return TrustScore(
            user_id=user_id, fulfillment_rate=0, delivery_timeliness=0,
            quality_avg=0, total_transactions=0, score=0, tier="New",
        )
    
    shipments = sb.table("shipments").select("status, actual_delivery, eta").in_("vehicle_id", vehicle_ids).execute()
    all_shipments = shipments.data or []
    
    total = len(all_shipments)
    delivered = [s for s in all_shipments if s.get("status") == "delivered"]
    
    fulfillment_rate = len(delivered) / total if total > 0 else 0
    
    # Timeliness: delivered before or on ETA
    timely = 0
    for s in delivered:
        if s.get("actual_delivery") and s.get("eta"):
            timely += 1  # Simplified
    delivery_timeliness = timely / len(delivered) if delivered else 0
    
    score = (
        fulfillment_rate * 50 +
        delivery_timeliness * 30 +
        min(total / 20, 1.0) * 20
    )
    score = round(min(100, score), 1)
    
    return TrustScore(
        user_id=user_id,
        fulfillment_rate=round(fulfillment_rate, 3),
        delivery_timeliness=round(delivery_timeliness, 3),
        quality_avg=0,
        total_transactions=total,
        score=score,
        tier=_score_to_tier(score),
    )


def _compute_buyer_trust(user_id: str) -> TrustScore:
    """Compute trust for a buyer."""
    sb = get_supabase()
    
    orders = sb.table("orders").select("status").eq("buyer_id", user_id).execute()
    all_orders = orders.data or []
    
    total = len(all_orders)
    completed = sum(1 for o in all_orders if o.get("status") == "delivered")
    
    fulfillment_rate = completed / total if total > 0 else 0
    score = round(min(100, fulfillment_rate * 80 + min(total / 10, 1.0) * 20), 1)
    
    return TrustScore(
        user_id=user_id,
        fulfillment_rate=round(fulfillment_rate, 3),
        delivery_timeliness=0,
        quality_avg=0,
        total_transactions=total,
        score=score,
        tier=_score_to_tier(score),
    )


def _score_to_tier(score: float) -> str:
    if score >= 80:
        return "Gold"
    elif score >= 60:
        return "Silver"
    elif score >= 40:
        return "Bronze"
    return "New"
