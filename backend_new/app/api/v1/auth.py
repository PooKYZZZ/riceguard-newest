from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserModel, UserCreate, UserLogin, UserResponse, Token
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate):
    """Register a new user."""
    db = get_db()
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    user_data = {
        "email": user_in.email,
        "name": user_in.name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    
    # Create access token
    access_token_expires = timedelta(hours=6)  # From settings
    access_token = create_access_token(
        data={"sub": user_in.email}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(result.inserted_id),
        email=user_in.email,
        name=user_in.name,
        created_at=user_data["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=datetime.utcnow() + access_token_expires,
        user=user_response
    )

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    """Authenticate user and return access token."""
    db = get_db()
    
    # Find user
    user_data = db.users.find_one({"email": user_in.email})
    if not user_data or not verify_password(user_in.password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(hours=6)  # From settings
    access_token = create_access_token(
        data={"sub": user_in.email}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=str(user_data["_id"]),
        email=user_data["email"],
        name=user_data["name"],
        created_at=user_data["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=datetime.utcnow() + access_token_expires,
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserModel = Depends(get_current_active_user)):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at
    )