from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class VehicleType(str, Enum):
    TRUCK = "truck"
    VAN = "van"
    BIKE = "bike"
    TEMPO = "tempo"


class ShipmentStatus(str, Enum):
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"


class VehicleCreate(BaseModel):
    vehicle_type: VehicleType
    capacity_kg: float = Field(gt=0)
    registration_no: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[VehicleType] = None
    capacity_kg: Optional[float] = Field(gt=0, default=None)
    available: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VehicleResponse(BaseModel):
    id: str
    transporter_id: str
    vehicle_type: VehicleType
    capacity_kg: float
    registration_no: str
    available: bool = True
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PickupPoint(BaseModel):
    farmer_id: str
    farmer_name: Optional[str] = None
    latitude: float
    longitude: float
    quantity_kg: float
    address: Optional[str] = None
    order: int = 0  # pickup sequence


class RouteInfo(BaseModel):
    distance_km: float
    duration_minutes: float
    waypoints: list[dict] = []


class ShipmentCreate(BaseModel):
    order_id: str
    vehicle_id: str
    pickup_points: list[PickupPoint]


class ShipmentResponse(BaseModel):
    id: str
    order_id: str
    vehicle_id: str
    vehicle_type: Optional[VehicleType] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    pickup_points: list[PickupPoint] = []
    route: Optional[RouteInfo] = None
    status: ShipmentStatus = ShipmentStatus.ASSIGNED
    eta: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    distance_km: Optional[float] = None
    cost: Optional[float] = None
    created_at: Optional[datetime] = None


class RouteOptimizeRequest(BaseModel):
    pickup_points: list[PickupPoint]
    delivery_lat: float
    delivery_lng: float


class AggregationRequest(BaseModel):
    crop_name: str
    total_quantity_kg: float = Field(gt=0)
    district: Optional[str] = None
    state: Optional[str] = None
    max_distance_km: float = Field(default=50.0, gt=0)
    grade_requirement: Optional[str] = None
    buyer_lat: Optional[float] = None
    buyer_lng: Optional[float] = None


class AggregationResult(BaseModel):
    farmer_id: str
    farmer_name: str
    product_id: str
    quantity_kg: float
    unit_price: float
    distance_km: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
