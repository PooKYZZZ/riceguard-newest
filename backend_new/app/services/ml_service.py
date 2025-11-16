import numpy as np
from PIL import Image
import io
import os
from typing import List, Dict, Tuple
import tensorflow as tf
from app.core.config import settings

class RiceDiseaseClassifier:
    def __init__(self):
        self.model = None
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
        
    def load_model(self):
        """Load the TensorFlow model."""
        if self.model is None:
            model_path = os.path.join(os.path.dirname(__file__), "../../..", settings.MODEL_PATH)
            if os.path.exists(model_path):
                try:
                    self.model = tf.keras.models.load_model(model_path)
                    print(f"✓ ML model loaded from {model_path}")
                except Exception as e:
                    print(f"⚠ Error loading ML model: {e}")
                    self.model = None
            else:
                print(f"⚠ ML model not found at {model_path}")
    
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for model prediction."""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size (assuming 224x224)
            image = image.resize((224, 224))
            
            # Convert to numpy array and normalize
            image_array = np.array(image, dtype=np.float32) / 255.0
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
        except Exception as e:
            print(f"⚠ Error preprocessing image: {e}")
            return None
    
    def predict(self, image_data: bytes) -> Tuple[Dict, bool]:
        """Make prediction on image data."""
        if self.model is None:
            self.load_model()
            
        if self.model is None:
            # Return default prediction if model not available
            return {
                "disease": "healthy",
                "confidence": 0.8,
                "description": "Model not available - defaulting to healthy"
            }, False
        
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            if processed_image is None:
                return None, False
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            
            # Get predicted class and confidence
            predicted_class_idx = np.argmax(predictions[0])
            confidence = float(np.max(predictions[0]))
            
            # Get disease key and info
            disease_key = self.class_names[predicted_class_idx]
            disease_info = self.disease_info.get(disease_key, {
                "name": disease_key.replace("_", " ").title(),
                "description": "Unknown disease"
            })
            
            # Check if confidence meets threshold
            meets_threshold = confidence >= settings.CONFIDENCE_THRESHOLD
            
            result = {
                "disease": disease_key,
                "disease_name": disease_info["name"],
                "confidence": confidence,
                "description": disease_info["description"],
                "all_predictions": [
                    {
                        "disease": self.class_names[i],
                        "confidence": float(predictions[0][i]),
                        "disease_name": self.disease_info[self.class_names[i]]["name"]
                    }
                    for i in range(len(self.class_names))
                ]
            }
            
            return result, meets_threshold
            
        except Exception as e:
            print(f"⚠ Error making prediction: {e}")
            return None, False

# Global classifier instance
classifier = RiceDiseaseClassifier()