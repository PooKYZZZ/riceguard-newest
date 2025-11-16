#!/usr/bin/env python3
"""
Test script for the ML service to verify it works correctly.
Run this script from the backend directory to test model loading and path resolution.
"""

import os
import sys
import logging

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.services.ml_service import classifier
    from app.core.config import settings
    print("✓ Successfully imported ML service modules")
except ImportError as e:
    print(f"✗ Failed to import ML service modules: {e}")
    sys.exit(1)

def test_model_path_resolution():
    """Test that model path resolution works correctly."""
    print("\n=== Testing Model Path Resolution ===")

    # Test path resolution
    try:
        model_status = classifier.get_model_status()
        print(f"Model status: {model_status}")

        if model_status['model_loaded']:
            print("✓ Model is already loaded")
            return True
        else:
            print(f"⚠ Model not loaded: {model_status.get('load_error', 'Unknown error')}")

            # Try to load the model
            print("Attempting to load model...")
            load_success = classifier.load_model()

            if load_success:
                print("✓ Model loaded successfully")
                return True
            else:
                print("✗ Failed to load model")
                return False

    except Exception as e:
        print(f"✗ Error during path resolution test: {e}")
        return False

def test_service_health():
    """Test the service health endpoint."""
    print("\n=== Testing Service Health ===")

    try:
        health_status = classifier.get_service_health()
        print(f"Service health: {health_status}")

        if health_status['status'] == 'healthy':
            print("✓ Service is healthy")
            return True
        else:
            print(f"⚠ Service status: {health_status['status']}")
            return False

    except Exception as e:
        print(f"✗ Error during health check: {e}")
        return False

def test_image_validation():
    """Test image validation functionality."""
    print("\n=== Testing Image Validation ===")

    # Test with invalid data
    try:
        invalid_result = classifier.validate_image_data(None)
        if not invalid_result['valid']:
            print("✓ Correctly identified None as invalid image data")
        else:
            print("✗ Failed to identify None as invalid")
            return False

        # Test with empty bytes
        empty_result = classifier.validate_image_data(b'')
        if not empty_result['valid']:
            print("✓ Correctly identified empty bytes as invalid")
        else:
            print("✗ Failed to identify empty bytes as invalid")
            return False

        print("✓ Image validation tests passed")
        return True

    except Exception as e:
        print(f"✗ Error during image validation test: {e}")
        return False

def test_fallback_prediction():
    """Test fallback prediction when model is not available."""
    print("\n=== Testing Fallback Prediction ===")

    try:
        # Test fallback prediction
        fallback_result = classifier._get_fallback_prediction("Test reason")

        expected_keys = ['disease', 'disease_name', 'confidence', 'success', 'fallback_reason']
        for key in expected_keys:
            if key not in fallback_result:
                print(f"✗ Missing key in fallback result: {key}")
                return False

        if fallback_result['disease'] == 'healthy':
            print("✓ Fallback prediction returns healthy as default")
        else:
            print("✗ Fallback prediction does not return healthy as default")
            return False

        if not fallback_result['success']:
            print("✓ Fallback prediction correctly marked as unsuccessful")
        else:
            print("✗ Fallback prediction incorrectly marked as successful")
            return False

        print("✓ Fallback prediction tests passed")
        return True

    except Exception as e:
        print(f"✗ Error during fallback prediction test: {e}")
        return False

def main():
    """Run all tests."""
    print("RiceGuard ML Service Test Suite")
    print("=" * 50)

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    tests = [
        test_model_path_resolution,
        test_service_health,
        test_image_validation,
        test_fallback_prediction
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print(f"\n=== Test Results ===")
    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())