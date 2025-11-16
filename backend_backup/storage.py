# Handles file uploads and saving them locally.

import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from settings import UPLOAD_DIR, MAX_UPLOAD_MB

ALLOWED_MIME = {"image/jpeg": ".jpg", "image/png": ".png"}


def ensure_upload_dir() -> None:
    """Create the main uploads folder if missing."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(file: UploadFile) -> str:
    """Save an uploaded image to /uploads and return its relative path."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .jpg and .png images are allowed",
        )

    # Read file bytes and check size
    contents = file.file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Max file size is {MAX_UPLOAD_MB} MB",
        )

    # Build folder path: /uploads/YYYY/MM/
    now = datetime.utcnow()
    subdir = os.path.join(UPLOAD_DIR, f"{now.year:04d}", f"{now.month:02d}")
    os.makedirs(subdir, exist_ok=True)

    # Create unique filename
    ext = ALLOWED_MIME[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(subdir, filename)

    # Write file to disk
    with open(path, "wb") as f:
        f.write(contents)

    # Normalize path for static serving
    return path.replace("\\", "/")
