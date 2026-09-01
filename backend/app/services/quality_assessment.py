"""
AI Produce Quality Assessment Service

Uses computer vision to analyze produce images and provide:
- Grade classification (A/B/C)
- Freshness score (0-100)
- Detected defects

For the hackathon MVP, uses a simple CNN (MobileNetV2 transfer learning)
with a rule-based fallback for demo purposes.
"""

import io
import math
from typing import Optional
from PIL import Image
from app.models.analytics import QualityAssessment, QualityGrade


async def assess_produce_quality(
    image_bytes: bytes,
    product_id: Optional[str] = None,
) -> QualityAssessment:
    """
    Analyze a produce image and return quality assessment.
    
    Pipeline:
    1. Preprocess image
    2. Run through trained model (or fallback to heuristic)
    3. Return grade + freshness + defects
    """
    try:
        return _model_assessment(image_bytes, product_id)
    except Exception:
        return _heuristic_assessment(image_bytes, product_id)


def _model_assessment(
    image_bytes: bytes,
    product_id: Optional[str] = None,
) -> QualityAssessment:
    """
    Run CNN model for quality assessment.
    
    In production, this would load a trained MobileNetV2 model.
    For hackathon, we check if a model file exists, otherwise fallback.
    """
    import os
    
    model_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "..", "ml_models", "produce_quality_model.pth"
    )
    
    if not os.path.exists(model_path):
        raise FileNotFoundError("Model not found")
    
    # Load and preprocess image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))
    
    import torch
    import torchvision.transforms as transforms
    from torchvision import models
    
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    tensor = transform(image).unsqueeze(0)
    
    # Load model
    model = models.mobilenet_v2(pretrained=False)
    model.classifier[1] = torch.nn.Linear(model.last_channel, 4)  # grade + 3 defects
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    
    with torch.no_grad():
        output = model(tensor)
    
    # Parse output
    probs = torch.softmax(output, dim=1).squeeze()
    grade_idx = probs[:3].argmax().item()
    grades = [QualityGrade.A, QualityGrade.B, QualityGrade.C]
    grade = grades[grade_idx]
    
    freshness = round(probs[:3][grade_idx].item() * 100, 1)
    confidence = round(probs.max().item(), 3)
    
    # Detect defects
    defects = []
    if probs[3].item() > 0.3:
        defects.append("surface_blemish")
    
    return QualityAssessment(
        product_id=product_id,
        grade=grade,
        freshness_score=freshness,
        defects=defects,
        confidence=confidence,
        model_version="mobilenet_v2_hackathon",
    )


def _heuristic_assessment(
    image_bytes: bytes,
    product_id: Optional[str] = None,
) -> QualityAssessment:
    """
    Heuristic quality assessment based on image properties.
    
    For hackathon demo: analyzes image color distribution, brightness,
    and contrast to estimate freshness and grade.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Get pixel data
    pixels = list(image.getdata())
    n = len(pixels)
    
    if n == 0:
        return QualityAssessment(
            product_id=product_id,
            grade=QualityGrade.B,
            freshness_score=50.0,
            defects=["unable_to_analyze"],
            confidence=0.3,
            model_version="heuristic_v1",
        )
    
    # Calculate image properties
    avg_r = sum(p[0] for p in pixels) / n
    avg_g = sum(p[1] for p in pixels) / n
    avg_b = sum(p[2] for p in pixels) / n
    
    brightness = (avg_r + avg_g + avg_b) / 3
    
    # Color variance (contrast indicator)
    variance = sum(
        (p[0] - avg_r) ** 2 + (p[1] - avg_g) ** 2 + (p[2] - avg_b) ** 2
        for p in pixels
    ) / n
    
    # Green content indicator (freshness proxy for vegetables)
    green_ratio = avg_g / max(brightness, 1)
    
    # Freshness score based on color properties
    freshness = 0
    
    # Brightness contributes (well-lit, vibrant produce scores higher)
    freshness += min(30, brightness / 255 * 30)
    
    # Green content (for vegetables — indicates freshness)
    freshness += min(30, green_ratio * 50)
    
    # Contrast (variety in color = natural, unprocessed)
    contrast_score = min(20, math.sqrt(variance) / 5)
    freshness += contrast_score
    
    # Add deterministic noise for demo variety
    hash_val = hash(image_bytes[:100])
    noise = (hash_val % 20) - 10  # -10 to +10
    freshness += noise
    
    freshness = max(0, min(100, round(freshness, 1)))
    
    # Grade based on freshness
    if freshness >= 75:
        grade = QualityGrade.A
    elif freshness >= 50:
        grade = QualityGrade.B
    else:
        grade = QualityGrade.C
    
    # Detect potential defects
    defects = []
    if brightness < 60:
        defects.append("dark_spots")
    if brightness > 220:
        defects.append("overexposed_check")
    if variance < 100:
        defects.append("uniform_color_check")
    if green_ratio < 0.25:
        defects.append("low_freshness_indicator")
    
    confidence = 0.55  # Heuristic confidence
    
    return QualityAssessment(
        product_id=product_id,
        grade=grade,
        freshness_score=freshness,
        defects=defects,
        confidence=confidence,
        model_version="heuristic_v1",
    )
