import os
from typing import List, ClassVar, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import secrets
from pathlib import Path

class Settings(BaseSettings):
    """
    Configuration settings for RiceGuard backend application.

    Environment variables take precedence over .env file values.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        validate_assignment=True
    )

    # Project Information
    PROJECT_NAME: str = "RiceGuard API"
    PROJECT_VERSION: str = "1.1.0"
    API_V1_STR: str = "/api/v1"

    # Environment Configuration
    ENVIRONMENT: str = Field(
        default="development",
        description="Application environment: development, testing, production"
    )
    DEBUG: bool = Field(
        default=True,
        description="Enable debug mode"
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL"
    )
    RELOAD: bool = Field(
        default=True,
        description="Enable auto-reload for development"
    )

    # Database Configuration
    MONGO_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI"
    )
    DB_NAME: str = Field(
        default="riceguard_db",
        description="MongoDB database name"
    )

    # Security Configuration
    JWT_SECRET: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="JWT secret key (use environment variable in production!)"
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="JWT algorithm"
    )
    TOKEN_EXPIRE_HOURS: int = Field(
        default=6,
        ge=1,
        le=168,  # 1 hour to 1 week
        description="JWT token expiration time in hours"
    )

    # File Upload Configuration
    UPLOAD_DIR: str = Field(
        default="uploads",
        description="Directory for file uploads"
    )
    MAX_UPLOAD_MB: int = Field(
        default=8,
        ge=1,
        le=50,
        description="Maximum upload file size in MB"
    )

    # ML Model Configuration
    MODEL_PATH: str = Field(
        default="ml/model.h5",
        description="Path to ML model file"
    )
    CONFIDENCE_THRESHOLD: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for ML predictions"
    )
    CONFIDENCE_MARGIN: float = Field(
        default=0.30,
        ge=0.0,
        le=1.0,
        description="Confidence margin for ML predictions"
    )

    # Cache Configuration (Redis)
    REDIS_URL: Optional[str] = Field(
        default=None,
        description="Redis connection URL for caching"
    )

    # CORS Configuration
    DEFAULT_ORIGINS: ClassVar[List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19000",
        "http://127.0.0.1:19000",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ]

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        """Get allowed origins from environment or use defaults."""
        allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
        if allowed_origins_str:
            return [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

        # Use different defaults based on environment
        if self.ENVIRONMENT == "production":
            # In production, require explicit origins
            return ["https://yourdomain.com"]
        else:
            # In development/testing, use permissive defaults
            return self.DEFAULT_ORIGINS

    @property
    def IS_DEVELOPMENT(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() in ("development", "dev")

    @property
    def IS_PRODUCTION(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def IS_TESTING(self) -> bool:
        """Check if running in testing environment."""
        return self.ENVIRONMENT.lower() in ("testing", "test")

    @field_validator("UPLOAD_DIR")
    @classmethod
    def create_upload_dir(cls, v):
        """Ensure upload directory exists."""
        upload_path = Path(v)
        upload_path.mkdir(parents=True, exist_ok=True)
        return str(upload_path.absolute())

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v):
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of: {valid_levels}")
        return v.upper()

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v, info):
        """Validate JWT secret is not the default in production."""
        if info.data.get("ENVIRONMENT", "").lower() == "production":
            if v in ("CHANGE_ME_SUPER_SECRET", "test_secret_key_for_testing_only"):
                raise ValueError(
                    "JWT_SECRET must be set to a strong, random value in production"
                )
        return v

# Create global settings instance
settings = Settings()

def get_settings() -> Settings:
    """Get the application settings instance."""
    return settings