from fastapi import APIRouter, HTTPException, status, Depends
from jose import jwt
from datetime import datetime, timedelta
from app.config import get_settings
from app.database import get_supabase, get_supabase_admin
from app.models.user import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    ProfileUpdate, ProfileResponse, UserRole,
)
from app.auth.middleware import get_current_user, UserPayload

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


def create_access_token(user_id: str, email: str, role: str, full_name: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "full_name": full_name,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    """Register a new user with Supabase Auth."""
    sb = get_supabase_admin()
    
    try:
        result = sb.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "full_name": data.full_name,
                    "role": data.role.value,
                }
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )
    
    if not result.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Email may already be in use.",
        )
    
    user = result.user
    
    # Create profile row
    profile_data = {
        "id": user.id,
        "full_name": data.full_name,
        "role": data.role.value,
        "phone": data.phone,
    }
    
    try:
        sb.table("profiles").insert(profile_data).execute()
    except Exception:
        pass  # Profile might already exist or RLS might block
    
    token = create_access_token(user.id, user.email, data.role.value, data.full_name)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=data.full_name,
            role=data.role,
            phone=data.phone,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login with email and password."""
    sb = get_supabase()
    
    try:
        result = sb.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    user = result.user
    
    # Fetch profile to get role
    profile_resp = sb.table("profiles").select("*").eq("id", user.id).execute()
    profile = profile_resp.data[0] if profile_resp.data else {}
    
    role = profile.get("role", "consumer")
    full_name = profile.get("full_name", user.user_metadata.get("full_name", ""))
    
    token = create_access_token(user.id, user.email, role, full_name)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=full_name,
            role=UserRole(role),
            phone=profile.get("phone"),
            avatar_url=profile.get("avatar_url"),
        ),
    )


@router.get("/me", response_model=ProfileResponse)
async def get_profile(user: UserPayload = Depends(get_current_user)):
    """Get current user's profile."""
    sb = get_supabase()
    
    result = sb.table("profiles").select("*").eq("id", user.id).execute()
    
    if not result.data:
        return ProfileResponse(
            id=user.id,
            full_name=user.full_name or "",
            role=UserRole(user.role),
        )
    
    profile = result.data[0]
    return ProfileResponse(
        id=profile["id"],
        full_name=profile.get("full_name", ""),
        role=UserRole(profile.get("role", "consumer")),
        phone=profile.get("phone"),
        district=profile.get("district"),
        state=profile.get("state"),
        latitude=profile.get("latitude"),
        longitude=profile.get("longitude"),
        avatar_url=profile.get("avatar_url"),
        created_at=profile.get("created_at"),
    )


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    user: UserPayload = Depends(get_current_user),
):
    """Update current user's profile."""
    sb = get_supabase()
    
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    
    sb.table("profiles").update(update_dict).eq("id", user.id).execute()
    
    # Return updated profile
    result = sb.table("profiles").select("*").eq("id", user.id).execute()
    profile = result.data[0] if result.data else {}
    
    return ProfileResponse(
        id=user.id,
        full_name=profile.get("full_name", user.full_name or ""),
        role=UserRole(profile.get("role", user.role)),
        phone=profile.get("phone"),
        district=profile.get("district"),
        state=profile.get("state"),
        latitude=profile.get("latitude"),
        longitude=profile.get("longitude"),
        avatar_url=profile.get("avatar_url"),
        created_at=profile.get("created_at"),
    )
