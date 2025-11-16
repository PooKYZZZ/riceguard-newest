"""
Comprehensive Import Tests for RiceGuard Backend

This test module ensures that all critical modules can be imported successfully.
Tests are designed to be fast, reliable, and provide clear feedback about import failures.

Key Features:
- Tests main FastAPI application import
- Tests heavy imports with proper error handling
- Provides detailed failure analysis
- Separates critical from optional imports
- Uses pytest.importorskip for optional dependencies
"""

import importlib
import sys
import traceback
from typing import List, Dict, Any
import pytest

# Test configuration
CRITICAL_MODULES = [
    # Core FastAPI application
    "app.main",

    # Core components
    "app.core.config",
    "app.core.error_handlers",

    # API routers
    "app.api.v1.auth",
    "app.api.v1.scans",
    "app.api.v1.recommendations",

    # Models and schemas
    "app.models.user",
    "app.models.scan",
    "app.schemas.auth",
    "app.schemas.scan",
]

HEAVY_MODULES = [
    # Database and ML components that might have external dependencies
    "app.core.database",
    "app.services.ml_service",
    "app.core.seed",
]

OPTIONAL_MODULES = [
    # Optional modules that should skip tests if dependencies are missing
    ("tensorflow", "tensorflow"),
    ("cv2", "opencv-python"),
    ("sklearn", "scikit-learn"),
    ("pymongo", "pymongo[srv]"),
    ("passlib", "passlib[bcrypt]"),
    ("python_jose", "python-jose[cryptography]"),
]


class ImportResult:
    """Helper class to track import results"""

    def __init__(self, module_name: str, success: bool, error: Exception = None,
                 load_time: float = 0.0, warning: str = None):
        self.module_name = module_name
        self.success = success
        self.error = error
        self.load_time = load_time
        self.warning = warning


def import_module_with_timing(module_name: str) -> ImportResult:
    """
    Import a module and measure load time.

    Args:
        module_name: Name of the module to import

    Returns:
        ImportResult with success status and timing
    """
    import time
    start_time = time.time()

    try:
        # Clear module from cache to test fresh import
        if module_name in sys.modules:
            del sys.modules[module_name]

        importlib.import_module(module_name)
        load_time = time.time() - start_time

        # Check for slow imports
        warning = None
        if load_time > 2.0:  # Modules taking > 2 seconds are considered slow
            warning = f"Slow import: {load_time:.2f} seconds"

        return ImportResult(module_name, True, load_time=load_time, warning=warning)

    except ImportError as e:
        return ImportResult(module_name, False, error=e, load_time=time.time() - start_time)
    except Exception as e:
        # Catch any other exceptions during import
        return ImportResult(module_name, False, error=e, load_time=time.time() - start_time)


def analyze_import_failure(result: ImportResult) -> Dict[str, Any]:
    """
    Analyze import failure and provide actionable information.

    Args:
        result: ImportResult from failed import

    Returns:
        Dictionary with analysis and recommendations
    """
    analysis = {
        "module": result.module_name,
        "error_type": type(result.error).__name__,
        "error_message": str(result.error),
        "likely_cause": None,
        "recommendation": None,
        "dependency_missing": False
    }

    error_msg = str(result.error).lower()

    # Common import failure patterns
    if "no module named" in error_msg:
        analysis["dependency_missing"] = True
        analysis["likely_cause"] = "Missing Python package"

        # Try to extract missing module name
        if "'" in error_msg:
            missing_module = error_msg.split("'")[1]
            analysis["recommendation"] = f"Install: pip install {missing_module}"

    elif "cannot import" in error_msg:
        analysis["likely_cause"] = "Module exists but requested symbol/function not found"
        analysis["recommendation"] = "Check module version or update imports"

    elif "circular" in error_msg:
        analysis["likely_cause"] = "Circular import dependency"
        analysis["recommendation"] = "Refactor imports to eliminate circular dependency"

    elif "permission" in error_msg or "denied" in error_msg:
        analysis["likely_cause"] = "File system permission issue"
        analysis["recommendation"] = "Check file permissions and directory access"

    elif "already loaded" in error_msg:
        analysis["likely_cause"] = "Module loading conflict"
        analysis["recommendation"] = "Restart Python process or check module conflicts"

    else:
        analysis["likely_cause"] = "Unknown import error"
        analysis["recommendation"] = "Check traceback for more details"

    return analysis


class TestCriticalImports:
    """Test cases for critical application modules"""

    @pytest.mark.critical
    @pytest.mark.imports
    def test_main_app_import(self):
        """
        Test that the main FastAPI application can be imported without errors.

        This is the most critical test - if main.py fails to import,
        the entire application will not start.
        """
        result = import_module_with_timing("app.main")

        if not result.success:
            # Provide detailed analysis for main import failure
            analysis = analyze_import_failure(result)

            pytest.fail(
                f"CRITICAL: Failed to import app.main\n"
                f"Error: {analysis['error_message']}\n"
                f"Likely Cause: {analysis['likely_cause']}\n"
                f"Recommendation: {analysis['recommendation']}\n"
                f"Load Time: {result.load_time:.3f}s"
            )

        # Warn about slow main imports
        if result.warning:
            pytest.warn(result.warning)

        # Assert reasonable load time for main module
        assert result.load_time < 5.0, f"Main app import too slow: {result.load_time:.2f}s"

    @pytest.mark.critical
    @pytest.mark.imports
    def test_core_modules_import(self):
        """
        Test that all core application modules can be imported.

        Core modules are essential for basic application functionality.
        """
        failed_imports = []
        slow_imports = []

        for module_name in CRITICAL_MODULES:
            result = import_module_with_timing(module_name)

            if not result.success:
                analysis = analyze_import_failure(result)
                failed_imports.append({
                    "module": module_name,
                    "error": str(result.error),
                    "analysis": analysis
                })
            elif result.warning:
                slow_imports.append(result.warning)

        # Fail with detailed information if any core modules fail to import
        if failed_imports:
            error_details = []
            for failure in failed_imports:
                analysis = failure["analysis"]
                error_details.append(
                    f"\n• {failure['module']}:\n"
                    f"  Error: {failure['error']}\n"
                    f"  Cause: {analysis['likely_cause']}\n"
                    f"  Fix: {analysis['recommendation']}"
                )

            pytest.fail(f"CRITICAL: Failed to import core modules:{''.join(error_details)}")

        # Warn about slow imports but don't fail the test
        if slow_imports:
            for warning in slow_imports:
                pytest.warn(warning)


class TestHeavyImports:
    """Test cases for heavy modules with external dependencies"""

    @pytest.mark.heavy_imports
    @pytest.mark.imports
    def test_database_import_with_guard(self):
        """
        Test database module import with proper error handling.

        Database imports might fail due to missing MongoDB dependencies
        or connection issues. We should handle these gracefully.
        """
        result = import_module_with_timing("app.core.database")

        if not result.success:
            analysis = analyze_import_failure(result)

            # If it's a missing dependency, provide helpful information
            if analysis["dependency_missing"]:
                pytest.warn(
                    f"Database module import skipped: {analysis['error_message']}. "
                    f"Install MongoDB dependencies with: pip install pymongo[srv]"
                )
                pytest.skip("Database dependencies not available")
            else:
                # For other errors, still fail but with good information
                pytest.fail(
                    f"Failed to import database module\n"
                    f"Error: {analysis['error_message']}\n"
                    f"Likely Cause: {analysis['likely_cause']}\n"
                    f"Recommendation: {analysis['recommendation']}"
                )

        # Database module should load reasonably fast
        assert result.load_time < 3.0, f"Database import too slow: {result.load_time:.2f}s"

    @pytest.mark.heavy_imports
    @pytest.mark.imports
    def test_ml_service_import_with_guard(self):
        """
        Test ML service import with proper error handling.

        ML service has heavy dependencies like TensorFlow and OpenCV
        that might not be available in all environments.
        """
        result = import_module_with_timing("app.services.ml_service")

        if not result.success:
            analysis = analyze_import_failure(result)

            # Check for specific ML dependency issues
            error_msg = str(result.error).lower()

            if "tensorflow" in error_msg or "tf" in error_msg:
                pytest.warn(
                    "TensorFlow not available - ML functionality will be limited. "
                    "Install with: pip install tensorflow"
                )
                pytest.skip("TensorFlow not available")
            elif "cv2" in error_msg or "opencv" in error_msg:
                pytest.warn(
                    "OpenCV not available - some image processing features may be limited. "
                    "Install with: pip install opencv-python"
                )
                pytest.skip("OpenCV not available")
            elif analysis["dependency_missing"]:
                pytest.warn(
                    f"ML service dependencies missing: {analysis['error_message']}. "
                    "Install ML dependencies with: pip install tensorflow opencv-python scikit-learn"
                )
                pytest.skip("ML dependencies not available")
            else:
                pytest.fail(
                    f"Failed to import ML service\n"
                    f"Error: {analysis['error_message']}\n"
                    f"Likely Cause: {analysis['likely_cause']}\n"
                    f"Recommendation: {analysis['recommendation']}"
                )

        # ML service is expected to be slower due to TensorFlow initialization
        assert result.load_time < 10.0, f"ML service import too slow: {result.load_time:.2f}s"


class TestOptionalDependencies:
    """Test optional dependencies that should skip if not available"""

    @pytest.mark.optional_deps
    @pytest.mark.imports
    @pytest.mark.parametrize("module_name,package_name", OPTIONAL_MODULES)
    def test_optional_imports(self, module_name, package_name):
        """
        Test optional dependencies using pytest.importorskip.

        These tests will be automatically skipped if the dependency
        is not available, which is the expected behavior.
        """
        try:
            # Use pytest.importorskip to handle optional dependencies gracefully
            imported_module = pytest.importorskip(module_name)
            assert imported_module is not None
        except ImportError:
            pytest.skip(f"Optional dependency '{module_name}' not available")


class TestImportPerformance:
    """Performance-related import tests"""

    @pytest.mark.performance
    @pytest.mark.imports
    def test_import_performance_regression(self):
        """
        Test that import times haven't regressed significantly.

        This test helps catch performance issues in imports.
        """
        performance_thresholds = {
            "app.main": 5.0,      # Main app should be fast
            "app.core.config": 1.0,  # Config should be very fast
            "app.core.database": 3.0,  # Database can be slower
        }

        failed_performance = []

        for module_name, threshold in performance_thresholds.items():
            result = import_module_with_timing(module_name)

            if result.success and result.load_time > threshold:
                failed_performance.append({
                    "module": module_name,
                    "load_time": result.load_time,
                    "threshold": threshold
                })

        if failed_performance:
            details = []
            for failure in failed_performance:
                details.append(
                    f"\n• {failure['module']}: {failure['load_time']:.2f}s "
                    f"(threshold: {failure['threshold']}s)"
                )

            pytest.fail(f"Import performance regression detected:{''.join(details)}")


# Test markers and configuration
pytest_plugins = []

# Custom markers for organizing test runs
def pytest_configure(config):
    """Configure custom pytest markers"""
    config.addinivalue_line(
        "markers", "critical: Marks tests as critical for application functionality"
    )
    config.addinivalue_line(
        "markers", "heavy_imports: Marks tests that load heavy dependencies"
    )
    config.addinivalue_line(
        "markers", "optional_deps: Marks tests for optional dependencies"
    )
    config.addinivalue_line(
        "markers", "imports: Marks all import-related tests"
    )
    config.addinivalue_line(
        "markers", "performance: Marks performance-related tests"
    )


if __name__ == "__main__":
    # Allow running this test module directly
    pytest.main([__file__, "-v", "--tb=short"])