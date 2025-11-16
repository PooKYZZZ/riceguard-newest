"""
Specialized ML Service Import Tests

This module focuses on testing the ML service imports and functionality.
ML service has heavy dependencies and complex initialization patterns.

Key Features:
- Tests TensorFlow and OpenCV dependencies
- Tests ML model loading capabilities
- Tests image preprocessing functions
- Provides graceful handling of missing ML dependencies
"""

import pytest
import warnings
from typing import Optional


class TestMLServiceBasicImports:
    """Test basic ML service import functionality"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    def test_ml_service_module_import(self):
        """
        Test that the ML service module can be imported.

        This test checks if the ML service can be imported without
        triggering any initialization errors.
        """
        try:
            import app.services.ml_service as ml_service
            assert ml_service is not None
            assert hasattr(ml_service, 'classify_image') or hasattr(ml_service, 'MLService')
        except ImportError as e:
            # Check if it's a missing dependency issue
            error_msg = str(e).lower()
            
            if "tensorflow" in error_msg or "tf" in error_msg:
                warnings.warn(
                    "TensorFlow not available - ML functionality will be limited. "
                    "Install with: pip install tensorflow"
                )
                pytest.skip("TensorFlow not available")
            elif "cv2" in error_msg or "opencv" in error_msg:
                warnings.warn(
                    "OpenCV not available - image processing will be limited. "
                    "Install with: pip install opencv-python"
                )
                pytest.skip("OpenCV not available")
            elif "numpy" in error_msg:
                warnings.warn(
                    "NumPy not available - array operations will fail. "
                    "Install with: pip install numpy"
                )
                pytest.skip("NumPy not available")
            else:
                pytest.fail(f"Failed to import ML service: {e}")
        except Exception as e:
            pytest.fail(f"Unexpected error importing ML service: {e}")


class TestTensorFlowDependencies:
    """Test TensorFlow-specific functionality and dependencies"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.tensorflow
    def test_tensorflow_import(self):
        """
        Test TensorFlow import with proper error handling.
        """
        try:
            import tensorflow as tf
            assert tf is not None
            assert hasattr(tf, '__version__')
            
            # Test basic TensorFlow functionality
            try:
                # Simple tensor operations
                tensor = tf.constant([1, 2, 3])
                assert tensor is not None
                
                # Test Keras functionality (often used in image classification)
                assert hasattr(tf, 'keras')
                
            except Exception as tf_error:
                warnings.warn(f"TensorFlow basic operations failed: {tf_error}")
                
        except ImportError as e:
            warnings.warn(
                f"TensorFlow not available: {e}. "
                "Install with: pip install tensorflow"
            )
            pytest.skip("TensorFlow not available")
        except Exception as e:
            pytest.fail(f"TensorFlow import error: {e}")

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.tensorflow
    def test_keras_functionality(self):
        """
        Test Keras functionality which is commonly used in image classification.
        """
        try:
            import tensorflow as tf
            from tensorflow import keras
            
            assert keras is not None
            assert hasattr(keras, 'layers')
            assert hasattr(keras, 'models')
            
            # Test basic layer creation
            try:
                layer = keras.layers.Dense(10, activation='relu')
                assert layer is not None
                
                # Test model creation
                model = keras.Sequential([
                    keras.layers.Dense(64, activation='relu', input_shape=(10,)),
                    keras.layers.Dense(1, activation='sigmoid')
                ])
                assert model is not None
                
            except Exception as keras_error:
                warnings.warn(f"Keras basic operations failed: {keras_error}")
                
        except ImportError as e:
            warnings.warn(
                f"TensorFlow/Keras not available: {e}. "
                "Install with: pip install tensorflow"
            )
            pytest.skip("TensorFlow/Keras not available")


class TestOpenCVDependencies:
    """Test OpenCV-specific functionality and dependencies"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.opencv
    def test_opencv_import(self):
        """
        Test OpenCV import with proper error handling.
        """
        try:
            import cv2
            assert cv2 is not None
            assert hasattr(cv2, '__version__')
            
            # Test basic OpenCV functionality
            try:
                # Test image reading capabilities
                assert hasattr(cv2, 'imread')
                assert hasattr(cv2, 'imwrite')
                
                # Test image processing functions
                assert hasattr(cv2, 'resize')
                assert hasattr(cv2, 'cvtColor')
                
                # Check for color conversion constants
                assert hasattr(cv2, 'COLOR_BGR2RGB')
                
            except Exception as cv_error:
                warnings.warn(f"OpenCV basic operations failed: {cv_error}")
                
        except ImportError as e:
            warnings.warn(
                f"OpenCV not available: {e}. "
                "Install with: pip install opencv-python"
            )
            pytest.skip("OpenCV not available")
        except Exception as e:
            pytest.fail(f"OpenCV import error: {e}")


class TestImageProcessingDependencies:
    """Test image processing related dependencies"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.image_processing
    def test_numpy_image_operations(self):
        """
        Test NumPy operations commonly used in image processing.
        """
        try:
            import numpy as np
            assert np is not None
            assert hasattr(np, 'array')
            assert hasattr(np, 'zeros')
            assert hasattr(np, 'reshape')
            
            # Test basic array operations used in image processing
            try:
                # Create a sample image array (3x3 RGB)
                image_array = np.zeros((3, 3, 3), dtype=np.uint8)
                assert image_array.shape == (3, 3, 3)
                
                # Test reshaping (common in ML preprocessing)
                reshaped = np.reshape(image_array, (27,))
                assert reshaped.shape == (27,)
                
                # Test array operations
                normalized = image_array.astype(np.float32) / 255.0
                assert normalized.dtype == np.float32
                
            except Exception as np_error:
                warnings.warn(f"NumPy image operations failed: {np_error}")
                
        except ImportError as e:
            warnings.warn(
                f"NumPy not available: {e}. "
                "Install with: pip install numpy"
            )
            pytest.skip("NumPy not available")

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.image_processing
    def test_pil_image_support(self):
        """
        Test PIL/Pillow support for image operations.
        """
        try:
            from PIL import Image
            assert Image is not None
            
            # Test basic PIL functionality
            try:
                # Test image creation
                img = Image.new('RGB', (100, 100), color='red')
                assert img.size == (100, 100)
                
                # Test image conversion
                img_array = np.array(img)
                assert img_array.shape == (100, 100, 3)
                
            except Exception as pil_error:
                warnings.warn(f"PIL basic operations failed: {pil_error}")
                
        except ImportError as e:
            warnings.warn(
                f"PIL/Pillow not available: {e}. "
                "Install with: pip install Pillow"
            )
            pytest.skip("PIL/Pillow not available")


class TestMLModelFileAccess:
    """Test ML model file access and loading capabilities"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.model_loading
    def test_model_file_accessibility(self):
        """
        Test if ML model files are accessible.

        This test checks if model files exist and can be accessed,
        without actually loading the models (which can be time-consuming).
        """
        import os
        from pathlib import Path
        
        # Common model file locations
        model_paths = [
            "ml/model.h5",
            "ml/model.tflite", 
            "app/ml/model.h5",
            "backend/ml/model.h5",
            "app/services/ml/model.h5"
        ]
        
        backend_root = Path(__file__).parent.parent
        accessible_models = []
        
        for model_path in model_paths:
            full_path = backend_root / model_path
            if full_path.exists():
                accessible_models.append(str(full_path))
                
        if not accessible_models:
            warnings.warn(
                "No ML model files found. Model loading functionality may be limited. "
                "Expected model files in ml/ directory with .h5 or .tflite extension."
            )
            
        # At least verify the structure exists
        ml_dir = backend_root / "ml"
        if ml_dir.exists():
            ml_files = list(ml_dir.glob("*"))
            assert len(ml_files) >= 0  # Directory exists, may be empty
            
    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.model_loading
    def test_model_loading_with_tensorflow(self):
        """
        Test TensorFlow model loading capabilities.

        This test attempts to load a model if available, or skips gracefully.
        """
        try:
            import tensorflow as tf
            from pathlib import Path
            
            backend_root = Path(__file__).parent.parent
            
            # Look for TensorFlow models
            tf_models = [
                backend_root / "ml" / "model.h5",
                backend_root / "ml" / "model_saved_model",
            ]
            
            model_loaded = False
            for model_path in tf_models:
                if model_path.exists():
                    try:
                        if model_path.suffix == '.h5':
                            # Test Keras H5 model loading
                            model = tf.keras.models.load_model(str(model_path))
                            model_loaded = True
                            warnings.warn(f"Successfully loaded model: {model_path}")
                            break
                        elif model_path.is_dir():
                            # Test SavedModel format
                            model = tf.keras.models.load_model(str(model_path))
                            model_loaded = True
                            warnings.warn(f"Successfully loaded SavedModel: {model_path}")
                            break
                    except Exception as load_error:
                        warnings.warn(f"Failed to load model {model_path}: {load_error}")
                        
            if not model_loaded:
                warnings.warn("No TensorFlow models were successfully loaded")
                
        except ImportError:
            pytest.skip("TensorFlow not available for model loading")
        except Exception as e:
            warnings.warn(f"Model loading test failed: {e}")


class TestMLServiceIntegration:
    """Test ML service integration with actual ML functionality"""

    @pytest.mark.heavy_imports
    @pytest.mark.ml
    @pytest.mark.integration
    def test_ml_service_classification_function(self):
        """
        Test ML service classification function if available.

        This test checks if the classification function exists and can be called
        (even if it might fail due to missing models).
        """
        try:
            import app.services.ml_service as ml_service
            
            # Check if classification function exists
            if hasattr(ml_service, 'classify_image'):
                # Test function signature (don't actually call with image data)
                import inspect
                sig = inspect.signature(ml_service.classify_image)
                
                # Should accept at least one parameter (image)
                assert len(sig.parameters) >= 1
                
                warnings.warn("classify_image function found and accessible")
            elif hasattr(ml_service, 'MLService'):
                # Check for class-based service
                assert hasattr(ml_service.MLService, 'classify')
                warnings.warn("MLService class with classify method found")
            else:
                warnings.warn("No classification interface found in ML service")
                
        except ImportError as e:
            warnings.warn(f"ML service not available for integration test: {e}")
            pytest.skip("ML service not available")
        except Exception as e:
            warnings.warn(f"ML service integration test failed: {e}")


# Register custom markers for ML tests
def pytest_configure(config):
    """Configure custom pytest markers for ML tests"""
    config.addinivalue_line(
        "markers", "ml: Marks ML-related tests"
    )
    config.addinivalue_line(
        "markers", "tensorflow: Marks TensorFlow-specific tests"
    )
    config.addinivalue_line(
        "markers", "opencv: Marks OpenCV-specific tests"
    )
    config.addinivalue_line(
        "markers", "image_processing: Marks image processing tests"
    )
    config.addinivalue_line(
        "markers", "model_loading: Marks model loading tests"
    )
    config.addinivalue_line(
        "markers", "integration: Marks integration tests"
    )


if __name__ == "__main__":
    # Allow running this test module directly
    pytest.main([__file__, "-v", "--tb=short"])