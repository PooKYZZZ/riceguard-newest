#!/usr/bin/env python3
"""
Simple Import Test Runner for RiceGuard Backend

This script provides a convenient way to run import tests and generate reports.
"""

import sys
import subprocess
import time
from pathlib import Path


def run_test_command(test_name, test_command):
    """Run a test command and return results"""
    print(f"\n{'='*60}")
    print(f"Running: {test_name}")
    print(f"Command: {' '.join(test_command)}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            test_command,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        duration = time.time() - start_time
        print(f"Completed in {duration:.2f} seconds")
        
        if result.returncode == 0:
            print("RESULT: PASSED")
        else:
            print("RESULT: FAILED")
        
        if result.stdout:
            print("OUTPUT:")
            print(result.stdout)
        
        if result.stderr:
            print("ERRORS:")
            print(result.stderr)
        
        return result.returncode, result.stdout, result.stderr
        
    except Exception as e:
        print(f"Error running command: {e}")
        return 1, "", str(e)


def main():
    """Main test runner"""
    print("RiceGuard Backend Import Test Runner")
    print("=" * 50)
    
    # Check if we're in the backend directory
    if not Path("app").exists():
        print("Error: This script must be run from the backend directory")
        print("Make sure you're in: riceguard/backend/")
        sys.exit(1)
    
    results = []
    
    # Test 1: Critical imports
    cmd1 = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py::TestCriticalImports",
        "-v",
        "--tb=short"
    ]
    exit_code, stdout, stderr = run_test_command("Critical Import Tests", cmd1)
    results.append(("Critical Tests", exit_code, stdout, stderr))
    
    # Test 2: ML imports
    cmd2 = [
        sys.executable, "-m", "pytest",
        "tests/test_ml_service_imports.py",
        "-v",
        "--tb=short"
    ]
    exit_code, stdout, stderr = run_test_command("ML Service Import Tests", cmd2)
    results.append(("ML Tests", exit_code, stdout, stderr))
    
    # Test 3: Database imports
    cmd3 = [
        sys.executable, "-m", "pytest",
        "tests/test_database_imports.py",
        "-v",
        "--tb=short"
    ]
    exit_code, stdout, stderr = run_test_command("Database Import Tests", cmd3)
    results.append(("Database Tests", exit_code, stdout, stderr))
    
    # Generate summary
    print(f"\n{'='*80}")
    print("IMPORT TEST REPORT SUMMARY")
    print(f"{'='*80}")
    
    total_tests = 0
    total_passed = 0
    total_failed = 0
    total_skipped = 0
    
    for test_name, exit_code, stdout, stderr in results:
        print(f"\n{test_name}")
        print("-" * len(test_name))
        
        if exit_code == 0:
            print("STATUS: PASSED")
        else:
            print("STATUS: FAILED")
        
        # Parse pytest output for statistics
        if stdout:
            lines = stdout.split('\n')
            for line in lines:
                if 'passed' in line and ('failed' in line or 'skipped' in line):
                    print(f"SUMMARY: {line.strip()}")
                    break
    
    print(f"\n{'='*40}")
    print("OVERALL SUMMARY")
    print(f"{'='*40}")
    
    success_count = sum(1 for _, exit_code, _ in results if exit_code == 0)
    print(f"Test Suites: {len(results)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(results) - success_count}")
    
    if success_count == len(results):
        print("\nAll test suites passed successfully!")
        print("Your application dependencies are properly configured.")
    else:
        print(f"\n{len(results) - success_count} test suite(s) failed.")
        print("Check the error messages above for details.")
    
    return success_count == len(results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)