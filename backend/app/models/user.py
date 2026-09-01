from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    FARMER = "farmer"
    FPO = "fpo"
    BUYER = "buyer"
    CONSUMER = "consumer"
    TRANSPORTER = "transporter"
    ADMIN = "admin"


class UserRegister(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CONSUMER


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
