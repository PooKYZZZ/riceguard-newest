import os
import uuid
import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId
import re
from app.core.database import get_db, DatabaseOperations, DatabaseError, as_object_id
from app.core.config import settings
from app.models.user import UserModel
from app.models.scan import ScanModel, ScanCreate, ScanResponse, ScanListResponse, DiseasePrediction
from app.services.ml_service_simple import classifier
from app.api.deps import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Allowed file extensions for image uploads
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/bmp', 'image/webp'
}

def validate_filename(filename: str) -> str:
    """Validate and sanitize filename."""
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    # Get file extension
    file_extension = os.path.splitext(filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sanitize filename - remove path traversal attempts and special characters
    sanitized_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
    sanitized_name = re.sub(r'\.\.', '_', sanitized_name)  # Prevent path traversal

    if len(sanitized_name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename too long (max 255 characters)"
        )

    return sanitized_name

def validate_upload_file(upload_file: UploadFile) -> None:
    """Comprehensive file validation."""
    # Validate filename
    validate_filename(upload_file.filename)

    # Validate MIME type
    if upload_file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type {upload_file.content_type} not allowed"
        )

def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file and return the URL."""
    # Validate file first
    validate_upload_file(upload_file)

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
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file"
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

    # Validate notes field
    if notes is not None:
        notes = notes.strip()
        if len(notes) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Notes too long (max 1000 characters)"
            )
        # Basic XSS prevention - remove potentially dangerous characters
        notes = re.sub(r'[<>"\']', '', notes)
        if not notes:  # If after sanitization notes is empty, set to None
            notes = None
    
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
    
    # Read file content for ML prediction first (before saving)
    file.file.seek(0)
    image_data = file.file.read()

    # Get ML prediction
    prediction_result, meets_threshold = classifier.predict(image_data)

    if prediction_result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing image"
        )

    # Save uploaded file after successful processing
    image_url = save_upload_file(file)
    
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

    # Save to database with error handling
    try:
        scan_id = await DatabaseOperations.insert_one("scans", scan_data)

        logger.info(f"New scan created: {scan_id} for user: {current_user.id}")

        # Return response
        return ScanResponse(
            id=scan_id,
            image_url=image_url,
            original_filename=file.filename,
            predictions=predictions,
            primary_disease=prediction_result["disease"],
            confidence=prediction_result["confidence"],
            notes=notes,
            model_version="1.0",
            created_at=scan_data["created_at"]
        )

    except DatabaseError as e:
        logger.error(f"Database error during scan creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save scan results"
        )
    except Exception as e:
        logger.error(f"Unexpected error during scan creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan creation failed"
        )

@router.get("/", response_model=ScanListResponse)
async def get_scans(
    page: int = 1,
    per_page: int = 10,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get user's scan history."""
    try:
        # Validate pagination parameters
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page must be greater than 0"
            )
        if per_page < 1 or per_page > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Per page must be between 1 and 100"
            )

        # Get total count
        total = await DatabaseOperations.count_documents(
            "scans",
            {"user_id": current_user.id}
        )

        # Calculate skip value for pagination
        skip = (page - 1) * per_page

        # Get scans with pagination
        scans_data = await DatabaseOperations.find_many(
            "scans",
            {"user_id": current_user.id},
            sort=[("created_at", -1)],
            skip=skip,
            limit=per_page
        )

        scans = []
        for scan_data in scans_data:
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

    except DatabaseError as e:
        logger.error(f"Database error retrieving scans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve scan history"
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving scans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve scans"
        )

@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get specific scan details."""
    try:
        # Validate and convert ObjectId
        object_id = as_object_id(scan_id)

        # Find scan
        scan_data = await DatabaseOperations.find_one(
            "scans",
            {
                "_id": object_id,
                "user_id": current_user.id
            }
        )

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

    except DatabaseError as e:
        logger.error(f"Database error retrieving scan {scan_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve scan"
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving scan {scan_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve scan"
        )

@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: str,
    current_user: UserModel = Depends(get_current_active_user)
):
    """Delete a scan."""
    try:
        # Validate and convert ObjectId
        object_id = as_object_id(scan_id)

        # Delete scan
        deleted = await DatabaseOperations.delete_one(
            "scans",
            {
                "_id": object_id,
                "user_id": current_user.id
            }
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )

        logger.info(f"Scan deleted: {scan_id} by user: {current_user.id}")

        return {"message": "Scan deleted successfully"}

    except DatabaseError as e:
        logger.error(f"Database error deleting scan {scan_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete scan"
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting scan {scan_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete scan"
        )

@router.get("/health/ml")
async def get_ml_health():
    """Get ML service health status."""
    try:
        health_status = classifier.get_service_health()
        return health_status
    except Exception as e:
        return {
            "service": "ml_classifier",
            "status": "error",
            "error": str(e),
            "model_available": False
        }
