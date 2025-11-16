from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from app.core.config import settings
import certifi

_client: MongoClient | None = None

def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGO_URI,
            uuidRepresentation="standard",
            tls=True,                         
            tlsCAFile=certifi.where(),        
            serverSelectionTimeoutMS=8000,    
        )
    return _client

def get_db():
    return get_client()[settings.DB_NAME]

def ensure_indexes():
    db = get_db()
    try:
        db.users.create_index([("email", ASCENDING)], unique=True, name="uniq_email")
        db.scans.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)], name="user_createdAt")
        print("✓ Database indexes created successfully")
    except Exception as e:
        print(f"⚠ Index creation warning: {e}")

def as_object_id(id_str: str) -> ObjectId:
    return ObjectId(id_str)