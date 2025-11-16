import os
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId
from app.core.database import get_db
from app.core.config import settings
from app.models.user import UserModel
from app.models.scan import ScanModel, ScanCreate, ScanResponse, ScanListResponse, DiseasePrediction
from app.services.ml_service import classifier
from app.api.deps import get_current_active_user

router = APIRouter()

def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file and return the URL."""
    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create file path
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = upload_file.file.read()
            buffer.write(content)
        
        # Return relative URL
        return f"/uploads/{unique_filename}"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )
    finally:
        upload_file.file.close()

@router.post("/", response_model=ScanResponse)
async def create_scan(
    file: UploadFile = File(...),
    notes: str = Form(None),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Upload and analyze a rice leaf image for disease detection."""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (max 8MB)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset position
    
    max_size = settings.MAX_UPLOAD_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.MAX_UPLOAD_MB}MB limit"
        )
    
    # Save uploaded file
    image_url = save_upload_file(file)
    
    # Read file content for ML prediction
    file.file.seek(0)
    image_data = file.file.read()
    file.file.close()
    
    # Get ML prediction
    prediction_result, meets_threshold = classifier.predict(image_data)
    
    if prediction_result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing image"
        )
    
    # Create disease predictions list
    predictions = [
        DiseasePrediction(
            disease=pred["disease"],
            confidence=pred["confidence"],
            description=pred.get("disease_name", pred["disease"].replace("_", " ").title())
        )
        for pred in prediction_result["all_predictions"]
    ]
    
    # Create scan record
    scan_data = {
        "user_id": current_user.id,
        "image_url": image_url,
        "original_filename": file.filename,
        "predictions": [pred.dict() for pred in predictions],
        "primary_disease": prediction_result["disease"],
        "confidence": prediction_result["confidence"],
        "notes": notes,
        "model_version": "1.0",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Save to database
    db = get_db()
    result = db.scans.insert_one(scan_data)
    scan_data["_id"] = result.inserted_id
    
    # Return response
    return ScanResponse(
        id=str(result.inserted_id),
        image_url=image_url,
        original_filename=file.filename,
        predictions=predictions,
        primary_disease=prediction_result["disease"],
        confidence=prediction_result["confidence"],
        notes=notes,
        model_version="1.0",
        created_at=scan_data["created_at"]
    )

@router.get("/", response_model=ScanListResponse)
async def get_scans(
    page: int = 1,
    per_page: int = 10,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get user's scan history."""
    db = get_db()
    
    # Calculate skip value
    skip = (page - 1) * per_page
    
    # Get total count
    total = db.scans.count_documents({"user_id": current_user.id})
    
    # Get scans with pagination
    scans_cursor = db.scans.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).skip(skip).limit(per_page)
    
    scans = []
    for scan_data in scans_cursor:
        # Convert prediction dicts back to DiseasePrediction objects
        predictions = [
            DiseasePrediction(**pred) for pred in scan_data["predictions"]
        ]
        
        scan = ScanResponse(
            id=str(scan_data["_id"]),
            image_url=scan_data["image_url"],
            original_filename=scan_data["original_filename"],
            predictions=predictions,
            primary_disease=scan_data["primary_disease"],
            confidence=scan_data["confidence"],
            notes=scan_data.get("notes"),
            model_version=scan_data.get("model_version", "1.0"),
            created_at=scan_data["created_at"]
        )
        scans.append(scan)
    
    return ScanListResponse(
        scans=scans,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get specific scan details."""
    db = get_db()
    
    try:
        object_id = ObjectId(scan_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    scan_data = db.scans.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not scan_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Convert prediction dicts back to DiseasePrediction objects
    predictions = [
        DiseasePrediction(**pred) for pred in scan_data["predictions"]
    ]
    
    return ScanResponse(
        id=str(scan_data["_id"]),
        image_url=scan_data["image_url"],
        original_filename=scan_data["original_filename"],
        predictions=predictions,
        primary_disease=scan_data["primary_disease"],
        confidence=scan_data["confidence"],
        notes=scan_data.get("notes"),
        model_version=scan_data.get("model_version", "1.0"),
        created_at=scan_data["created_at"]
    )

@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: str,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Delete a scan."""
    db = get_db()
    
    try:
        object_id = ObjectId(scan_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Find and delete scan
    result = db.scans.delete_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return {"message": "Scan deleted successfully"}