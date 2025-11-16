import os
import logging
from typing import Dict, Tuple, Optional
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import TensorFlow, but handle gracefully if not available
try:
    import tensorflow as tf
    import numpy as np
    from PIL import Image
    import io
    TENSORFLOW_AVAILABLE = True
except ImportError as e:
    TENSORFLOW_AVAILABLE = False
    logger.warning(f"TensorFlow not available: {e}. ML predictions will use fallback mode.")

class RiceDiseaseClassifier:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.load_error = None
        self.class_names = [
            "bacterial_blight",
            "brown_spot", 
            "healthy",
            "leaf_blast",
            "tungro"
        ]
        self.disease_info = {
            "bacterial_blight": {
                "name": "Bacterial Blight",
                "description": "Bacterial disease causing water-soaked lesions on leaf margins"
            },
            "brown_spot": {
                "name": "Brown Spot", 
                "description": "Fungal disease causing brown, oval spots with gray centers"
            },
            "healthy": {
                "name": "Healthy Leaf",
                "description": "No disease detected - leaf appears healthy"
            },
            "leaf_blast": {
                "name": "Leaf Blast",
                "description": "Fungal disease causing diamond-shaped lesions with gray centers"
            },
            "tungro": {
                "name": "Tungro",
                "description": "Viral disease causing yellow-orange discoloration and stunting"
            }
        }
        
    def load_model(self) -> bool:
        """Load the TensorFlow model with graceful fallback."""
        if not TENSORFLOW_AVAILABLE:
            self.load_error = "TensorFlow not available"
            self.model_loaded = False
            return False
            
        # Implementation would go here if TensorFlow is available
        self.model_loaded = False
        self.load_error = "Model loading not implemented in fallback mode"
        return False
        
    def predict(self, image_data: bytes) -> Tuple[Optional[Dict], bool]:
        """Make prediction with fallback behavior."""
        if not TENSORFLOW_AVAILABLE or not self.is_model_available():
            return self._get_fallback_prediction("ML model not available"), False
            
        # Would implement real prediction here
        return self._get_fallback_prediction("Model prediction not implemented"), False

    def is_model_available(self) -> bool:
        """Check if model is loaded and available for predictions."""
        return TENSORFLOW_AVAILABLE and self.model_loaded and self.model is not None

    def _get_fallback_prediction(self, reason: str) -> Dict:
        """Generate fallback prediction when model is not available."""
        logger.info(f"Using fallback prediction: {reason}")
        
        return {
            "disease": "healthy",
            "disease_name": "Healthy Leaf",
            "confidence": 0.5,
            "description": "ML model not available - defaulting to healthy classification",
            "success": False,
            "fallback_reason": reason,
            "model_status": "unavailable",
            "confidence_threshold_met": False,
            "all_predictions": [
                {
                    "disease": disease,
                    "confidence": 0.2 if disease != "healthy" else 0.5,
                    "disease_name": self.disease_info[disease]["name"]
                }
                for disease in self.class_names
            ]
        }

    def get_service_health(self) -> Dict:
        """Get comprehensive health status of the ML service."""
        return {
            "service": "ml_classifier",
            "status": "degraded" if not TENSORFLOW_AVAILABLE else "healthy",
            "tensorflow_available": TENSORFLOW_AVAILABLE,
            "model_loaded": self.model_loaded,
            "load_error": self.load_error,
            "class_count": len(self.class_names),
            "confidence_threshold": getattr(settings, 'CONFIDENCE_THRESHOLD', 0.5)
        }

# Global classifier instance
classifier = RiceDiseaseClassifier()