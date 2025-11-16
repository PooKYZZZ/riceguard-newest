import os
from typing import List

# NEW: load .env from the backend folder
from pathlib import Path                 # NEW
from dotenv import load_dotenv           # NEW
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))  # NEW

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "riceguard_db")
JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_SUPER_SECRET")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_HOURS: int = int(os.getenv("TOKEN_EXPIRE_HOURS", "6"))
UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "8"))

_default_origins = [
    "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:19000",
    "http://127.0.0.1:19006",
    "http://localhost:19000",
    "http://localhost:19006",
]

ALLOWED_ORIGINS: List[str] = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    ",".join(_default_origins)
).split(",") if o.strip()]
