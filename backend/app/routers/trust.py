from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.models.analytics import TrustScore, TrustScoreUpdate
from app.auth.middleware import get_current_user, UserPayload
from app.services.trust_score import compute_trust_score

router = APIRouter(prefix="/api/trust", tags=["trust"])


@router.get("/score/{user_id}", response_model=TrustScore)
async def get_trust_score(
    user_id: str,
    user: UserPayload = Depends(get_current_user),
):
    """Get the AgriTrust score for a user."""
    sb = get_supabase()
    
    result = sb.table("trust_scores").select("*").eq("user_id", user_id).execute()
    
    if not result.data:
        # Compute from scratch
        score = await compute_trust_score(user_id)
        return score
    
    data = result.data[0]
    total = data.get("total_transactions", 0)
    
    return TrustScore(
        user_id=user_id,
        fulfillment_rate=data.get("fulfillment_rate", 0),
        delivery_timeliness=data.get("delivery_timeliness", 0),
        quality_avg=data.get("quality_avg", 0),
        total_transactions=total,
        score=data.get("score", 0),
        tier=_score_to_tier(data.get("score", 0)),
        updated_at=data.get("updated_at"),
    )


@router.get("/my-score", response_model=TrustScore)
async def get_my_trust_score(user: UserPayload = Depends(get_current_user)):
    """Get my own AgriTrust score."""
    return await get_trust_score(user.id, user)


@router.post("/recalculate/{user_id}")
async def recalculate_trust_score(
    user_id: str,
    user: UserPayload = Depends(get_current_user),
):
    """Force recalculation of a user's trust score."""
    sb = get_supabase()
    
    score = await compute_trust_score(user_id)
    
    # Upsert
    existing = sb.table("trust_scores").select("id").eq("user_id", user_id).execute()
    
    if existing.data:
        sb.table("trust_scores").update(score.model_dump()).eq("user_id", user_id).execute()
    else:
        sb.table("trust_scores").insert({"user_id": user_id, **score.model_dump()}).execute()
    
    return score


@router.get("/leaderboard")
async def get_leaderboard(
    role: str = "farmer",
    limit: int = 10,
    user: UserPayload = Depends(get_current_user),
):
    """Get top users by trust score for a given role."""
    sb = get_supabase()
    
    profiles = (
        sb.table("profiles")
        .select("id, full_name, role, district")
        .eq("role", role)
        .execute()
    )
    
    scores = sb.table("trust_scores").select("*").execute()
    score_map = {s["user_id"]: s for s in (scores.data or [])}
    
    leaderboard = []
    for p in (profiles.data or []):
        s = score_map.get(p["id"], {})
        leaderboard.append({
            "user_id": p["id"],
            "name": p.get("full_name", ""),
            "district": p.get("district", ""),
            "score": s.get("score", 0),
            "tier": _score_to_tier(s.get("score", 0)),
            "total_transactions": s.get("total_transactions", 0),
        })
    
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return leaderboard[:limit]


def _score_to_tier(score: float) -> str:
    if score >= 80:
        return "Gold"
    elif score >= 60:
        return "Silver"
    elif score >= 40:
        return "Bronze"
    return "New"
