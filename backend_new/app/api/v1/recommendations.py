from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.core.database import get_db

router = APIRouter()

@router.get("/{disease_key}")
async def get_recommendations(disease_key: str):
    """Get treatment recommendations for a specific disease."""
    db = get_db()
    
    # Find recommendations for the disease
    recommendation = db.recommendations.find_one({"diseaseKey": disease_key})
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendations not found for this disease"
        )
    
    return {
        "diseaseKey": recommendation["diseaseKey"],
        "diseaseName": recommendation["diseaseName"],
        "recommendations": recommendation["recommendations"]
    }

@router.get("/")
async def get_all_recommendations():
    """Get all available disease recommendations."""
    db = get_db()
    
    recommendations_cursor = db.recommendations.find({})
    recommendations = []
    
    for rec in recommendations_cursor:
        recommendations.append({
            "diseaseKey": rec["diseaseKey"],
            "diseaseName": rec["diseaseName"],
            "recommendations": rec["recommendations"]
        })
    
    return {"recommendations": recommendations}