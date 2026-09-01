from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


# Demand Forecasting
class DemandForecast(BaseModel):
    crop_name: str
    district: str
    forecast_date: date
    predicted_demand_kg: float
    confidence_lower: float
    confidence_upper: float
    trend: Optional[str] = None  # "up", "down", "stable"


class DemandForecastRequest(BaseModel):
    crop_name: str
    district: str
    horizon_days: int = Field(default=7, ge=1, le=90)


class DemandForecastResponse(BaseModel):
    crop_name: str
    district: str
    forecasts: list[DemandForecast]
    summary: str
    confidence_level: str


# Price Intelligence
class PriceRecommendation(BaseModel):
    product_id: str
    crop_name: str
    market_reference: float
    recommended_min: float
    recommended_max: float
    demand_signal: str  # "high", "medium", "low"
    supply_factor: float
    created_at: Optional[datetime] = None


class PriceRecommendationRequest(BaseModel):
    crop_name: str
    district: str
    quantity_kg: float = 1.0


# Market Prices
class MarketPrice(BaseModel):
    crop_name: str
    district: str
    market_name: str
    price_per_kg: float
    date: date
    source: str = "manual"


class MarketPriceCreate(BaseModel):
    crop_name: str
    district: str
    market_name: str
    price_per_kg: float
    date: date


# Quality Assessment
class QualityGrade(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class QualityAssessment(BaseModel):
    product_id: Optional[str] = None
    grade: QualityGrade
    freshness_score: float = Field(ge=0, le=100)
    defects: list[str] = []
    confidence: float = Field(ge=0, le=1)
    image_url: Optional[str] = None
    model_version: str = "v1.0"
    created_at: Optional[datetime] = None


# AgriTrust Score
class TrustScore(BaseModel):
    user_id: str
    fulfillment_rate: float = Field(ge=0, le=1)
    delivery_timeliness: float = Field(ge=0, le=1)
    quality_avg: float = Field(ge=0, le=1)
    total_transactions: int = 0
    score: float = Field(ge=0, le=100)
    tier: str  # "Gold", "Silver", "Bronze"
    updated_at: Optional[datetime] = None


class TrustScoreUpdate(BaseModel):
    fulfillment_rate: Optional[float] = Field(ge=0, le=1, default=None)
    delivery_timeliness: Optional[float] = Field(ge=0, le=1, default=None)
    quality_avg: Optional[float] = Field(ge=0, le=1, default=None)


# Impact Dashboard
class ImpactMetrics(BaseModel):
    total_farmers: int = 0
    total_buyers: int = 0
    total_orders: int = 0
    total_revenue: float = 0
    avg_farmer_realization: float = 0
    fulfillment_rate: float = 0
    avg_delivery_time_hours: float = 0
    wastage_reduction_pct: float = 0
    transport_savings_pct: float = 0
    monthly_trend: list[dict] = []
