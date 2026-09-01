from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional
from app.config import get_settings

settings = get_settings()
security = HTTPBearer()


class UserPayload(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserPayload:
    """Extract and validate the current user from the Authorization header."""
    payload = decode_token(credentials.credentials)
    
    user_id = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role", "consumer")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    return UserPayload(
        id=user_id,
        email=email,
        role=role,
        full_name=payload.get("full_name"),
    )


def require_role(*allowed_roles: str):
    """Dependency factory that restricts access to specific roles."""
    async def role_checker(user: UserPayload = Depends(get_current_user)) -> UserPayload:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return user
    return role_checker


# Common role dependencies
require_farmer = require_role("farmer", "fpo")
require_buyer = require_role("buyer", "consumer")
require_transporter = require_role("transporter")
require_admin = require_role("admin")
require_farmer_or_fpo = require_role("farmer", "fpo")
require_any_authenticated = require_role("farmer", "fpo", "buyer", "consumer", "transporter", "admin")
