import importlib
import pytest

def test_import_main():
    """Test that main.py can be imported without errors"""
    importlib.import_module("app.main")
