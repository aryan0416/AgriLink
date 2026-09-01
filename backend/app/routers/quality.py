from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.database import get_supabase
from app.models.analytics import QualityAssessment, QualityGrade
from app.auth.middleware import get_current_user, UserPayload
from app.services.quality_assessment import assess_produce_quality

router = APIRouter(prefix="/api/quality", tags=["quality"])


@router.post("/assess", response_model=QualityAssessment)
async def assess_quality(
    product_id: str = None,
    image: UploadFile = File(...),
    user: UserPayload = Depends(get_current_user),
):
    """
    Upload a produce image and get AI-based quality assessment.
    
    Returns grade (A/B/C), freshness score, and detected defects.
    """
    # Read image bytes
    image_bytes = await image.read()
    
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")
    
    # Run quality assessment
    assessment = await assess_produce_quality(image_bytes, product_id)
    
    # Save to database if product_id provided
    sb = get_supabase()
    
    if product_id:
        # Save assessment
        sb.table("quality_assessments").insert({
            "product_id": product_id,
            "grade": assessment.grade.value,
            "freshness_score": assessment.freshness_score,
            "defects": assessment.defects,
            "confidence": assessment.confidence,
            "model_version": assessment.model_version,
        }).execute()
        
        # Update product with quality score
        sb.table("products").update({
            "grade": assessment.grade.value,
        }).eq("id", product_id).execute()
    
    return assessment


@router.get("/product/{product_id}", response_model=QualityAssessment)
async def get_quality_assessment(
    product_id: str,
    user: UserPayload = Depends(get_current_user),
):
    """Get the latest quality assessment for a product."""
    sb = get_supabase()
    
    result = (
        sb.table("quality_assessments")
        .select("*")
        .eq("product_id", product_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No quality assessment found")
    
    assessment = result.data[0]
    return QualityAssessment(
        product_id=assessment.get("product_id"),
        grade=assessment.get("grade", "B"),
        freshness_score=assessment.get("freshness_score", 50),
        defects=assessment.get("defects", []),
        confidence=assessment.get("confidence", 0),
        image_url=assessment.get("image_url"),
        model_version=assessment.get("model_version", "v1.0"),
        created_at=assessment.get("created_at"),
    )
