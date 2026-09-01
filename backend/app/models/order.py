from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class OrderType(str, Enum):
    RETAIL = "retail"
    BULK = "bulk"
    SUBSCRIPTION = "subscription"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    AGGREGATING = "aggregating"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItemStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    FULFILLED = "fulfilled"


class OrderItemCreate(BaseModel):
    product_id: str
    quantity_kg: float = Field(gt=0)


class OrderCreate(BaseModel):
    order_type: OrderType = OrderType.RETAIL
    items: list[OrderItemCreate] = Field(min_length=1)
    delivery_address: str
    delivery_date: Optional[date] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str] = None
    quantity_kg: float
    price_per_kg: float
    farmer_id: str
    farmer_name: Optional[str] = None
    status: OrderItemStatus = OrderItemStatus.PENDING
    image_url: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    buyer_id: str
    buyer_name: Optional[str] = None
    order_type: OrderType
    items: list[OrderItemResponse] = []
    total_amount: float
    status: OrderStatus
    delivery_address: str
    delivery_date: Optional[date] = None
    created_at: Optional[datetime] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemStatusUpdate(BaseModel):
    status: OrderItemStatus
