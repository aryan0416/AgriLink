from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class ProductGrade(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class ProductStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    EXPIRED = "expired"


class ProductCreate(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    grade: ProductGrade = ProductGrade.B
    quantity_kg: float = Field(gt=0)
    unit_price: float = Field(gt=0)
    harvest_date: date
    shelf_life_days: int = Field(gt=0, default=7)
    district: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProductUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    grade: Optional[ProductGrade] = None
    quantity_kg: Optional[float] = Field(gt=0, default=None)
    unit_price: Optional[float] = Field(gt=0, default=None)
    shelf_life_days: Optional[int] = Field(gt=0, default=None)
    status: Optional[ProductStatus] = None


class ProductResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: Optional[str] = None
    seller_trust_score: Optional[float] = None
    crop_name: str
    variety: Optional[str] = None
    grade: ProductGrade
    quantity_kg: float
    unit_price: float
    harvest_date: date
    shelf_life_days: int
    district: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: list[str] = []
    status: ProductStatus = ProductStatus.ACTIVE
    ai_recommended_price: Optional[float] = None
    demand_signal: Optional[str] = None
    quality_score: Optional[float] = None
    created_at: Optional[datetime] = None


class ProductSearch(BaseModel):
    crop_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_quantity: Optional[float] = None
    grade: Optional[ProductGrade] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = 50.0
    limit: int = Field(default=20, le=100)
    offset: int = Field(default=0, ge=0)
