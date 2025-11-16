import numpy as np
from PIL import Image
import io
import os
import logging
from typing import List, Dict, Tuple, Optional
import tensorflow as tf
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

    def _resolve_model_path(self) -> Optional[str]:
        """
        Resolve model path from multiple possible locations.
        Returns absolute path if model is found, None otherwise.
        """
        # Try multiple possible model locations
        possible_paths = [
            # From backend directory (working directory when running backend)
            os.path.join(os.getcwd(), "ml", "model.h5"),
            # From project root (one level up from backend)
            os.path.join(os.path.dirname(os.getcwd()), "ml", "model.h5"),
            # From relative path to backend app directory
            os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model.h5"),
            # Using settings.MODEL_PATH as relative to backend root
            os.path.join(os.path.dirname(__file__), "..", "..", settings.MODEL_PATH),
            # Absolute path from project root
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "riceguard", "ml", "model.h5"),
            # Using settings.MODEL_PATH as absolute path
            settings.MODEL_PATH if os.path.isabs(settings.MODEL_PATH) else None
        ]

        # Filter out None values
        possible_paths = [path for path in possible_paths if path is not None]

        for model_path in possible_paths:
            if os.path.exists(model_path):
                logger.info(f"Found model at: {model_path}")
                return os.path.abspath(model_path)
            else:
                logger.debug(f"Model not found at: {model_path}")

        logger.error("Model not found in any of the expected locations")
        logger.info(f"Searched paths: {possible_paths}")
        return None

    def load_model(self) -> bool:
        """
        Load the TensorFlow model with improved error handling.
        Returns True if model loaded successfully, False otherwise.
        """
        if self.model_loaded:
            return True

        try:
            model_path = self._resolve_model_path()

            if model_path is None:
                error_msg = "Model file not found in any expected location"
                logger.error(error_msg)
                self.load_error = error_msg
                self.model_loaded = False
                return False

            if not os.path.exists(model_path):
                error_msg = f"Model path resolved but file not found: {model_path}"
                logger.error(error_msg)
                self.load_error = error_msg
                self.model_loaded = False
                return False

            # Check file size (should be a substantial ML model file)
            file_size = os.path.getsize(model_path)
            if file_size < 1024 * 1024:  # Less than 1MB seems suspicious for an ML model
                logger.warning(f"Model file seems small: {file_size} bytes")

            logger.info(f"Loading ML model from: {model_path}")

            # Load the model with error handling
            self.model = tf.keras.models.load_model(model_path)
            self.model_loaded = True
            self.load_error = None

            logger.info(f"✓ ML model loaded successfully from {model_path}")
            logger.info(f"Model input shape: {self.model.input_shape if hasattr(self.model, 'input_shape') else 'Unknown'}")

            return True

        except Exception as e:
            error_msg = f"Failed to load ML model: {str(e)}"
            logger.error(error_msg)
            self.load_error = error_msg
            self.model = None
            self.model_loaded = False
            return False

    def is_model_available(self) -> bool:
        """Check if model is loaded and available for predictions."""
        return self.model_loaded and self.model is not None

    def get_model_status(self) -> Dict:
        """Get current model status information."""
        return {
            "model_loaded": self.model_loaded,
            "model_available": self.is_model_available(),
            "load_error": self.load_error,
            "model_path": self._resolve_model_path() if not self.model_loaded else "Loaded"
        }
    
    def preprocess_image(self, image_data: bytes) -> Optional[np.ndarray]:
        """
        Preprocess image for model prediction with improved error handling.
        Returns preprocessed image array or None if preprocessing fails.
        """
        if not image_data:
            logger.error("Empty image data provided")
            return None

        try:
            # Validate image data size
            if len(image_data) < 100:  # Very small images are likely invalid
                logger.error(f"Image data too small: {len(image_data)} bytes")
                return None

            # Convert bytes to PIL Image with multiple format attempts
            try:
                image = Image.open(io.BytesIO(image_data))
            except Exception as first_error:
                logger.warning(f"Initial image loading failed: {first_error}")
                # Try to verify and fix image data
                try:
                    # Verify it's actually image data
                    image = Image.open(io.BytesIO(image_data))
                    image.verify()  # Verify without loading
                    # Reopen after verify
                    image = Image.open(io.BytesIO(image_data))
                except Exception as second_error:
                    logger.error(f"Image data validation failed: {second_error}")
                    return None

            # Get image info for logging
            original_format = image.format
            original_mode = image.mode
            original_size = image.size
            logger.debug(f"Processing image: {original_format}, {original_mode}, {original_size}")

            # Convert to RGB if necessary
            if image.mode != 'RGB':
                logger.debug(f"Converting image from {image.mode} to RGB")
                image = image.convert('RGB')

            # Define target size (can be adjusted based on model requirements)
            target_size = (224, 224)

            # Resize with high-quality resampling (compatible with older Pillow versions)
            try:
                # Try newer constant first (Pillow >= 9.1.0)
                image = image.resize(target_size, Image.Resampling.LANCZOS)
            except AttributeError:
                # Fallback for older Pillow versions
                image = image.resize(target_size, Image.LANCZOS)

            # Convert to numpy array with proper data type
            image_array = np.array(image, dtype=np.float32)

            # Validate array shape and values
            if image_array.shape != (224, 224, 3):
                logger.error(f"Unexpected image shape: {image_array.shape}")
                return None

            # Check for completely black or white images
            mean_val = np.mean(image_array)
            if mean_val < 5 or mean_val > 250:
                logger.warning(f"Image seems unusual (mean pixel value: {mean_val})")

            # Normalize to [0, 1] range
            image_array = image_array / 255.0

            # Add batch dimension (1, 224, 224, 3)
            image_array = np.expand_dims(image_array, axis=0)

            logger.debug(f"Successfully preprocessed image to shape: {image_array.shape}")
            return image_array

        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            logger.debug(f"Image data length: {len(image_data) if image_data else 0}")
            return None

    def validate_image_data(self, image_data: bytes) -> Dict:
        """
        Validate image data and return information about it.
        Returns dictionary with validation results.
        """
        if not image_data:
            return {
                "valid": False,
                "error": "No image data provided",
                "size": 0
            }

        try:
            # Try to open the image
            image = Image.open(io.BytesIO(image_data))

            # Get basic information
            info = {
                "valid": True,
                "format": image.format,
                "mode": image.mode,
                "size": image.size,
                "file_size": len(image_data)
            }

            # Additional validation
            if len(image_data) > 50 * 1024 * 1024:  # 50MB limit
                info["valid"] = False
                info["error"] = "Image too large (>50MB)"
            elif image.size[0] < 50 or image.size[1] < 50:
                info["valid"] = False
                info["error"] = "Image too small (<50x50 pixels)"
            elif image.format not in ['JPEG', 'JPG', 'PNG', 'BMP', 'TIFF']:
                info["warning"] = f"Unusual image format: {image.format}"

            return info

        except Exception as e:
            return {
                "valid": False,
                "error": f"Invalid image data: {str(e)}",
                "size": len(image_data)
            }
    
    def predict(self, image_data: bytes) -> Tuple[Optional[Dict], bool]:
        """
        Make prediction on image data with comprehensive error handling and fallback behavior.
        Returns tuple of (prediction_result, success_status).
        """
        # Validate input first
        if not image_data:
            error_result = {
                "disease": "error",
                "confidence": 0.0,
                "error": "No image data provided",
                "success": False
            }
            return error_result, False

        # Try to load model if not already loaded
        if not self.is_model_available():
            logger.info("Model not loaded, attempting to load...")
            if not self.load_model():
                logger.warning("Failed to load model, using fallback behavior")
                return self._get_fallback_prediction("Model not available"), False

        # Validate image data
        validation_result = self.validate_image_data(image_data)
        if not validation_result["valid"]:
            logger.error(f"Invalid image data: {validation_result.get('error', 'Unknown error')}")
            error_result = {
                "disease": "error",
                "confidence": 0.0,
                "error": f"Invalid image: {validation_result.get('error', 'Unknown error')}",
                "success": False,
                "validation_info": validation_result
            }
            return error_result, False

        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            if processed_image is None:
                logger.error("Failed to preprocess image")
                return self._get_fallback_prediction("Image preprocessing failed"), False

            # Make prediction with error handling
            try:
                predictions = self.model.predict(processed_image, verbose=0)
            except Exception as predict_error:
                logger.error(f"Model prediction failed: {predict_error}")
                return self._get_fallback_prediction("Model prediction failed"), False

            # Validate predictions
            if predictions is None or len(predictions) == 0:
                logger.error("Model returned no predictions")
                return self._get_fallback_prediction("No predictions from model"), False

            prediction_array = predictions[0]
            if len(prediction_array) != len(self.class_names):
                logger.error(f"Prediction output size mismatch: {len(prediction_array)} vs {len(self.class_names)}")
                return self._get_fallback_prediction("Model output format mismatch"), False

            # Get predicted class and confidence
            predicted_class_idx = np.argmax(prediction_array)
            confidence = float(np.max(prediction_array))

            # Validate confidence value
            if not (0.0 <= confidence <= 1.0):
                logger.warning(f"Unexpected confidence value: {confidence}")
                confidence = max(0.0, min(1.0, confidence))

            # Get disease key and info
            if 0 <= predicted_class_idx < len(self.class_names):
                disease_key = self.class_names[predicted_class_idx]
                disease_info = self.disease_info.get(disease_key, {
                    "name": disease_key.replace("_", " ").title(),
                    "description": "Unknown disease"
                })
            else:
                logger.error(f"Invalid predicted class index: {predicted_class_idx}")
                return self._get_fallback_prediction("Invalid prediction result"), False

            # Check if confidence meets threshold
            meets_threshold = confidence >= settings.CONFIDENCE_THRESHOLD

            # Check confidence margin if required
            if meets_threshold and hasattr(settings, 'CONFIDENCE_MARGIN'):
                sorted_predictions = np.sort(prediction_array)[::-1]  # Sort descending
                if len(sorted_predictions) >= 2:
                    confidence_margin = sorted_predictions[0] - sorted_predictions[1]
                    meets_threshold = meets_threshold and (confidence_margin >= settings.CONFIDENCE_MARGIN)

            result = {
                "disease": disease_key,
                "disease_name": disease_info["name"],
                "confidence": confidence,
                "description": disease_info["description"],
                "success": True,
                "model_status": "loaded",
                "confidence_threshold_met": meets_threshold,
                "all_predictions": [
                    {
                        "disease": self.class_names[i],
                        "confidence": float(prediction_array[i]),
                        "disease_name": self.disease_info[self.class_names[i]]["name"]
                    }
                    for i in range(len(self.class_names))
                ]
            }

            logger.info(f"Prediction successful: {disease_key} (confidence: {confidence:.3f})")
            return result, meets_threshold

        except Exception as e:
            logger.error(f"Unexpected error during prediction: {str(e)}")
            return self._get_fallback_prediction(f"Prediction error: {str(e)}"), False

    def _get_fallback_prediction(self, reason: str) -> Dict:
        """
        Generate fallback prediction when model is not available or prediction fails.
        """
        logger.info(f"Generating fallback prediction: {reason}")

        # Return a safe default prediction
        fallback_result = {
            "disease": "healthy",
            "disease_name": "Healthy Leaf",
            "confidence": 0.5,  # Moderate confidence for fallback
            "description": "Unable to process image - defaulting to healthy classification",
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

        return fallback_result

    def get_service_health(self) -> Dict:
        """
        Get comprehensive health status of the ML service.
        """
        model_status = self.get_model_status()

        health_status = {
            "service": "ml_classifier",
            "status": "healthy" if model_status["model_available"] else "degraded",
            "model": model_status,
            "class_count": len(self.class_names),
            "supported_formats": ["JPEG", "JPG", "PNG", "BMP", "TIFF"],
            "target_image_size": (224, 224),
            "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
            "timestamp": str(os.path.getmtime(__file__))
        }

        if hasattr(settings, 'CONFIDENCE_MARGIN'):
            health_status["confidence_margin"] = settings.CONFIDENCE_MARGIN

        return health_status

# Global classifier instance
classifier = RiceDiseaseClassifier()