import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RiceGuard API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "riceguard_db"
    
    # Security
    JWT_SECRET: str = "CHANGE_ME_SUPER_SECRET"
    JWT_ALGORITHM: str = "HS256"
    TOKEN_EXPIRE_HOURS: int = 6
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 8
    
    # ML Model
    MODEL_PATH: str = "ml/model.h5"
    CONFIDENCE_THRESHOLD: float = 0.50
    CONFIDENCE_MARGIN: float = 0.30
    
    # CORS
    DEFAULT_ORIGINS = [
        "http://localhost:8081",
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:19000",
        "http://127.0.0.1:19006",
        "http://localhost:19000",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    
    ALLOWED_ORIGINS: List[str] = [
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",") 
        if o.strip()
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()