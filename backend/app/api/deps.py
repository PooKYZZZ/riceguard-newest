from typing import Generator
from fastapi import Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.user import UserModel

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> UserModel:
    """Get current authenticated user from JWT token."""
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    db = get_db()
    user_data = db.users.find_one({"email": email})
    
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserModel(**user_data)

async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Get current active user."""
    return current_user