# RiceGuard Backend Import Tests

This directory contains comprehensive import testing for the RiceGuard backend application. The test suite ensures that all critical modules can be imported successfully and provides detailed feedback about any import failures.

## 🎯 Purpose

The import tests serve several important purposes:

1. **Validate Dependencies**: Ensure all required Python packages are properly installed
2. **Detect Configuration Issues**: Identify problems with Python path and environment setup
3. **Prevent Runtime Errors**: Catch import issues before application startup
4. **Monitor Performance**: Track import times to catch performance regressions
5. **Graceful Degradation**: Handle missing optional dependencies appropriately

## 📁 Test Files

### Core Import Tests
- **`test_import_main_improved.py`**: Comprehensive main import tests with detailed error analysis
- **`test_import_main.py`**: Original import tests (legacy)

### Specialized Import Tests
- **`test_ml_service_imports.py`**: ML service and TensorFlow/OpenCV dependency tests
- **`test_database_imports.py`**: Database and MongoDB/PyMongo dependency tests

## 🚀 Quick Start

### Run All Import Tests
```bash
# From the backend directory
python -m pytest tests/test_import_main_improved.py -v

# Or use the test runner
python run_import_tests.py
```

### Run Specific Test Categories
```bash
# Critical tests only
python run_import_tests.py --critical

# ML-related tests
python run_import_tests.py --ml-only

# Database tests
python run_import_tests.py --db-only

# Performance tests
python run_import_tests.py --performance

# Fast tests (skip heavy dependencies)
python run_import_tests.py --fast
```

### Generate Coverage Report
```bash
python run_import_tests.py --coverage
```

## 📊 Test Categories

### Critical Tests (`@pytest.mark.critical`)
These tests validate that essential application modules can be imported:
- Main FastAPI application (`app.main`)
- Core components (`app.core.*`)
- API routers (`app.api.v1.*`)
- Data models (`app.models.*`)

**Impact**: ❌ Critical failures will prevent application startup

### Heavy Import Tests (`@pytest.mark.heavy_imports`)
Tests for modules with external dependencies that may not be available in all environments:
- Database connectivity (`app.core.database`)
- ML service functionality (`app.services.ml_service`)
- Model loading and preprocessing

**Impact**: ⚠️ Failures may indicate missing optional dependencies

### Performance Tests (`@pytest.mark.performance`)
Monitor import times to catch performance regressions:
- Main application import (< 5 seconds)
- Configuration loading (< 1 second)
- Database module import (< 3 seconds)

**Impact**: 📈 Slow imports affect application startup time

### Optional Dependency Tests (`@pytest.mark.optional_deps`)
Tests for optional dependencies using `pytest.importorskip`:
- TensorFlow
- OpenCV
- Scikit-learn
- PyMongo
- Passlib
- Python-jose

**Impact**: ⏭️ Skipped automatically if dependencies are missing

## 🛠️ Custom Test Markers

The test suite uses custom pytest markers for organization:

```ini
[pytest]
markers =
    critical: Tests critical for application functionality
    heavy_imports: Tests that load heavy dependencies
    optional_deps: Tests for optional dependencies
    imports: All import-related tests
    performance: Performance-related tests
    slow: Tests that take longer to run
    ml: ML-related tests
    database: Database-related tests
    mongodb: MongoDB-specific tests
    opencv: OpenCV-specific tests
    tensorflow: TensorFlow-specific tests
    image_processing: Image processing tests
    model_loading: Model loading tests
    integration: Integration tests
    connection: Database connection tests
    models: Database model tests
    config: Configuration tests
    seed: Database seeding tests
```

## 📋 Test Results Interpretation

### ✅ Passed
All imports successful and within performance thresholds.

### ⏭️ Skipped
Optional dependencies not available (normal for minimal installations).

### ❌ Failed
Critical import issues that need immediate attention:
- Missing required packages
- Configuration problems
- Circular import dependencies
- Permission issues

### ⚠️ Warnings
Non-critical issues that should be addressed:
- Slow import times
- Missing optional dependencies
- Model file accessibility issues

## 🔧 Configuration

### Pytest Configuration (`pytest.ini`)
```ini
[pytest]
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*

markers =
    critical: Marks tests as critical for application functionality
    heavy_imports: Marks tests that load heavy dependencies
    # ... (see full list above)

addopts = -v --tb=short --strict-markers --color=yes
testpaths = tests
minversion = 6.0
```

### Environment Variables
The tests respect these environment variables:
- `MONGO_URI`: MongoDB connection string
- `PYTHONPATH`: Python module search path
- `TF_CPP_MIN_LOG_LEVEL`: TensorFlow logging level

## 📈 Performance Benchmarking

Import time thresholds are enforced to catch performance regressions:

| Module | Threshold | Purpose |
|--------|-----------|---------|
| `app.main` | < 5.0s | Fast application startup |
| `app.core.config` | < 1.0s | Quick configuration loading |
| `app.core.database` | < 3.0s | Reasonable database initialization |
| `app.services.ml_service` | < 10.0s | Allow for TensorFlow loading |

## 🐛 Troubleshooting

### Common Issues and Solutions

#### ImportError: No module named 'app.main'
```bash
# Ensure you're in the backend directory
cd riceguard/backend

# Check Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run tests
python -m pytest tests/test_import_main_improved.py
```

#### TensorFlow Import Errors
```bash
# Install TensorFlow
pip install tensorflow

# Or use CPU-only version
pip install tensorflow-cpu

# Set TensorFlow logging level
export TF_CPP_MIN_LOG_LEVEL=2
```

#### OpenCV Import Errors
```bash
# Install OpenCV
pip install opencv-python

# Or for additional features
pip install opencv-contrib-python
```

#### MongoDB/PyMongo Import Errors
```bash
# Install PyMongo with SRV support
pip install pymongo[srv]

# For async support
pip install motor
```

### Debug Mode
Run tests with extra debugging information:
```bash
python -m pytest tests/ -v -s --tb=long
```

### Verbose Import Analysis
Run individual test modules for detailed analysis:
```bash
python -m pytest tests/test_import_main_improved.py::TestCriticalImports::test_main_app_import -v -s
```

## 📝 Development Guidelines

### Adding New Import Tests

1. **Use Appropriate Markers**: Mark tests with relevant markers for categorization
2. **Handle Missing Dependencies**: Use `pytest.importorskip` for optional dependencies
3. **Provide Helpful Error Messages**: Include installation instructions for missing packages
4. **Test Performance**: Include timing assertions for critical imports
5. **Document Purpose**: Add clear docstrings explaining what each test validates

### Example New Test
```python
@pytest.mark.heavy_imports
@pytest.mark.optional_deps
def test_new_dependency_import(self):
    """Test new optional dependency with proper error handling"""
    try:
        new_library = pytest.importorskip("new_library")
        assert new_library is not None
    except ImportError:
        warnings.warn(
            "New library not available. Install with: pip install new-library"
        )
        pytest.skip("New library not available")
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Import Tests
  run: |
    cd backend
    python run_import_tests.py --critical
    python run_import_tests.py --performance
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
cd backend
python run_import_tests.py --fast
```

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Python Import System](https://docs.python.org/3/reference/import.html)
- [TensorFlow Installation Guide](https://www.tensorflow.org/install)
- [OpenCV Python Installation](https://opencv-python-tutroals.readthedocs.io/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)

## 🤝 Contributing

When adding new import tests:

1. Follow the existing code style and patterns
2. Use descriptive test names and docstrings
3. Include appropriate markers for categorization
4. Handle missing dependencies gracefully
5. Add performance assertions for critical imports
6. Update this documentation as needed

## 📊 Test History

Track import test results over time to identify trends:
- Monitor success rates
- Track import performance changes
- Identify dependency version conflicts
- Plan dependency upgrades based on test results

---

**Last Updated**: 2025-11-17  
**Maintainer**: RiceGuard Development Team  
**Version**: 1.0.0