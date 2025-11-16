# backend/routers.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from pymongo import DESCENDING

from db import as_object_id, get_db
from ml_service import predict_image                   # ← keep if your ML service is present
from security import create_access_token, decode_token, hash_password, verify_password
from storage import ensure_upload_dir, save_upload
from models import (
    RegisterIn, RegisterOut,
    LoginIn, LoginOut, LoginUser,
    ScanItem, ScanListOut,
    RecommendationOut, DiseaseKey,
)

router = APIRouter()
bearer = HTTPBearer(auto_error=False)

# -------------------- local helper DTOs -------------------- #
class JWTClaims(BaseModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None

class BulkDeleteIn(BaseModel):
    ids: List[str]

class DeleteOneOut(BaseModel):
    deleted: bool
    id: str

class BulkDeleteOut(BaseModel):
    deletedCount: int

# ----------------------- auth helper ----------------------- #
def require_user(creds: Optional[HTTPAuthorizationCredentials]) -> JWTClaims:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        payload = decode_token(creds.credentials)
        return JWTClaims(**payload)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ============================ AUTH ========================= #
@router.post("/auth/register", response_model=RegisterOut, tags=["auth"])
def register(body: RegisterIn) -> RegisterOut:
    db: Any = get_db()
    if db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    doc = {
        "name": body.name,
        "email": body.email,
        "passwordHash": hash_password(body.password),
        "createdAt": datetime.now(timezone.utc),
    }
    res = db.users.insert_one(doc)
    return RegisterOut(id=str(res.inserted_id), name=body.name, email=body.email)

@router.post("/auth/login", response_model=LoginOut, tags=["auth"])
def login(body: LoginIn) -> LoginOut:
    db: Any = get_db()
    user = db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token, expires_at = create_access_token(
        subject=str(user["_id"]),
        extra_claims={"email": user["email"], "name": user["name"]},
    )
    return LoginOut(
        accessToken=token,
        expiresAt=expires_at,
        user=LoginUser(id=str(user["_id"]), name=user["name"], email=user["email"]),
    )

# ============================ SCANS ======================== #
@router.post("/scans", response_model=ScanItem, tags=["scans"])
def create_scan(
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    modelVersion: str = Form("1.0"),
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> ScanItem:
    claims = require_user(creds)
    user_id = claims.sub

    db: Any = get_db()
    ensure_upload_dir()

    # Save image
    image_path = save_upload(file)

    # ML inference
    try:
        label_str, confidence = predict_image(image_path)
        label = DiseaseKey.parse(label_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")

    # Persist
    doc = {
        "userId": as_object_id(user_id),
        "label": label.value,
        "confidence": float(confidence),
        "modelVersion": modelVersion,
        "notes": notes,
        "imageUrl": image_path,
        "createdAt": datetime.now(timezone.utc),
    }
    res = db.scans.insert_one(doc)

    return ScanItem(
        id=str(res.inserted_id),
        label=label,
        confidence=float(confidence),
        modelVersion=modelVersion,
        notes=notes,
        imageUrl=image_path,
        createdAt=doc["createdAt"],
    )

@router.get("/scans", response_model=ScanListOut, tags=["scans"])
def list_scans(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> ScanListOut:
    claims = require_user(creds)
    user_id = claims.sub

    db: Any = get_db()
    cursor = db.scans.find({"userId": as_object_id(user_id)}).sort("createdAt", DESCENDING)

    items: List[ScanItem] = []
    for d in cursor:
        items.append(
            ScanItem(
                id=str(d["_id"]),
                label=DiseaseKey.parse(d["label"]),
                confidence=d.get("confidence"),
                modelVersion=d["modelVersion"],
                notes=d.get("notes"),
                imageUrl=d.get("imageUrl"),
                createdAt=d["createdAt"],
            )
        )
    return ScanListOut(items=items)

# ========================= DELETE SCANS ==================== #
@router.delete("/scans/{scan_id}", response_model=DeleteOneOut, tags=["scans"])
def delete_scan(scan_id: str, creds: HTTPAuthorizationCredentials = Depends(bearer)) -> DeleteOneOut:
    claims = require_user(creds)
    user_id = claims.sub

    db: Any = get_db()
    res = db.scans.delete_one({"_id": as_object_id(scan_id), "userId": as_object_id(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return DeleteOneOut(deleted=True, id=scan_id)

@router.post("/scans/bulk-delete", response_model=BulkDeleteOut, tags=["scans"])
def bulk_delete_scans(payload: BulkDeleteIn, creds: HTTPAuthorizationCredentials = Depends(bearer)) -> BulkDeleteOut:
    claims = require_user(creds)
    user_id = claims.sub

    if not payload.ids:
        return BulkDeleteOut(deletedCount=0)

    db: Any = get_db()
    ids = [as_object_id(i) for i in payload.ids]
    res = db.scans.delete_many({"_id": {"$in": ids}, "userId": as_object_id(user_id)})
    return BulkDeleteOut(deletedCount=res.deleted_count)

# ======================= RECOMMENDATIONS =================== #
@router.get("/recommendations/{diseaseKey}", response_model=RecommendationOut, tags=["recommendations"])
def get_recommendation(diseaseKey: DiseaseKey) -> RecommendationOut:
    db: Any = get_db()
    doc = db.recommendations.find_one({"diseaseKey": diseaseKey.value})
    if not doc:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return RecommendationOut(
        diseaseKey=diseaseKey,
        title=doc["title"],
        steps=doc["steps"],
        version=doc["version"],
        updatedAt=doc["updatedAt"],
    )
