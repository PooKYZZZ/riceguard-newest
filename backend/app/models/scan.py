from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel, Field

class DiseasePrediction(BaseModel):
    disease: str
    confidence: float
    description: Optional[str] = None

class ScanModel(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    image_url: str
    original_filename: str
    predictions: List[DiseasePrediction]
    primary_disease: str
    confidence: float
    notes: Optional[str] = None
    model_version: str = "1.0"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

class ScanCreate(BaseModel):
    image_url: str
    original_filename: str
    predictions: List[DiseasePrediction]
    primary_disease: str
    confidence: float
    notes: Optional[str] = None
    model_version: str = "1.0"

class ScanResponse(BaseModel):
    id: str
    image_url: str
    original_filename: str
    predictions: List[DiseasePrediction]
    primary_disease: str
    confidence: float
    notes: Optional[str] = None
    model_version: str
    created_at: datetime

    model_config = {"from_attributes": True}

class ScanListResponse(BaseModel):
    scans: List[ScanResponse]
    total: int
    page: int
    per_page: int