#!/usr/bin/env python3
"""
Comprehensive Import Test Runner for RiceGuard Backend

This script provides a convenient way to run all import tests with different
configurations and generate detailed reports.

Usage:
    python run_import_tests.py                    # Run all import tests
    python run_import_tests.py --critical         # Run only critical tests
    python run_import_tests.py --ml-only         # Run only ML-related tests
    python run_import_tests.py --db-only         # Run only database tests
    python run_import_tests.py --performance     # Include performance tests
    python run_import_tests.py --full-report     # Generate detailed HTML report
"""

import sys
import argparse
import subprocess
import time
from pathlib import Path
from typing import List, Optional


def run_command(cmd: List[str], description: str) -> tuple[int, str, str]:
    """
    Run a command and return exit code, stdout, and stderr.
    
    Args:
        cmd: Command to run as list of strings
        description: Description of the command being run
        
    Returns:
        Tuple of (exit_code, stdout, stderr)
    """
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        duration = time.time() - start_time
        print(f"Completed in {duration:.2f} seconds")
        
        if result.stdout:
            print("STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        return result.returncode, result.stdout, result.stderr
        
    except Exception as e:
        print(f"Error running command: {e}")
        return 1, "", str(e)


def run_critical_tests():
    """Run only critical import tests"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py::TestCriticalImports",
        "-v",
        "--tb=short",
        "-m", "critical"
    ]
    return run_command(cmd, "Critical Import Tests")


def run_ml_tests():
    """Run ML-specific import tests"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_ml_service_imports.py",
        "-v",
        "--tb=short",
        "-m", "ml"
    ]
    return run_command(cmd, "ML Service Import Tests")


def run_database_tests():
    """Run database-specific import tests"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_database_imports.py",
        "-v",
        "--tb=short",
        "-m", "database"
    ]
    return run_command(cmd, "Database Import Tests")


def run_all_import_tests():
    """Run all import tests"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py",
        "tests/test_ml_service_imports.py", 
        "tests/test_database_imports.py",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "All Import Tests")


def run_performance_tests():
    """Run tests with performance focus"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py::TestImportPerformance",
        "-v",
        "--tb=short",
        "--durations=10"  # Show 10 slowest tests
    ]
    return run_command(cmd, "Performance Import Tests")


def run_with_coverage():
    """Run tests with coverage reporting"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py",
        "tests/test_ml_service_imports.py",
        "tests/test_database_imports.py",
        "--cov=app",
        "--cov-report=html",
        "--cov-report=term-missing",
        "--cov-report=xml",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Import Tests with Coverage")


def run_skip_heavy():
    """Run tests but skip heavy imports (faster execution)"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_import_main_improved.py",
        "-v",
        "--tb=short",
        "-m", "not heavy_imports"
    ]
    return run_command(cmd, "Fast Import Tests (Skipping Heavy Dependencies)")


def generate_test_report(results: List[tuple]):
    """Generate a summary report of test results"""
    print(f"\n{'='*80}")
    print("IMPORT TEST REPORT SUMMARY")
    print(f"{'='*80}")
    
    total_tests = 0
    total_passed = 0
    total_failed = 0
    total_skipped = 0
    total_errors = 0
    
    for description, exit_code, stdout, stderr in results:
        print(f"\n{description}")
        print("-" * len(description))
        
        if exit_code == 0:
            print("✅ PASSED")
        else:
            print("❌ FAILED")
        
        # Parse pytest output for statistics
        if stdout:
            lines = stdout.split('\n')
            for line in lines:
                if 'passed' in line and 'failed' in line:
                    # Extract numbers from pytest summary line
                    import re
                    numbers = re.findall(r'(\d+) (passed|failed|skipped|error)', line)
                    for num, status in numbers:
                        num = int(num)
                        total_tests += num
                        if status == 'passed':
                            total_passed += num
                        elif status == 'failed':
                            total_failed += num
                        elif status == 'skipped':
                            total_skipped += num
                        elif status == 'error':
                            total_errors += num
                    print(f"📊 {line.strip()}")
                    break
    
    print(f"\n{'='*40}")
    print("OVERALL SUMMARY")
    print(f"{'='*40}")
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {total_passed}")
    print(f"❌ Failed: {total_failed}")
    print(f"⏭️  Skipped: {total_skipped}")
    print(f"💥 Errors: {total_errors}")
    
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    # Recommendations based on results
    print(f"\n📋 RECOMMENDATIONS:")
    if total_failed == 0 and total_errors == 0:
        print("✅ All import tests passed! Your application dependencies are properly configured.")
    else:
        if total_failed > 0:
            print("🔧 Some critical imports failed. Check the error messages above.")
            print("   - Verify all required packages are installed")
            print("   - Check your Python path and environment")
        if total_skipped > 0:
            print("⚠️  Some tests were skipped due to missing optional dependencies.")
            print("   - This is normal for environments without ML/database libraries")
            print("   - Install optional dependencies if you need full functionality")
    
    return total_failed == 0 and total_errors == 0


def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(
        description="Run RiceGuard backend import tests",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_import_tests.py                    # Run all import tests
  python run_import_tests.py --critical         # Run only critical tests
  python run_import_tests.py --ml-only         # Run only ML-related tests
  python run_import_tests.py --db-only         # Run only database tests
  python run_import_tests.py --performance     # Include performance tests
  python run_import_tests.py --coverage        # Generate coverage report
  python run_import_tests.py --fast            # Skip heavy dependencies
        """
    )
    
    parser.add_argument(
        '--critical',
        action='store_true',
        help='Run only critical import tests'
    )
    parser.add_argument(
        '--ml-only',
        action='store_true',
        help='Run only ML-related import tests'
    )
    parser.add_argument(
        '--db-only',
        action='store_true',
        help='Run only database-related import tests'
    )
    parser.add_argument(
        '--performance',
        action='store_true',
        help='Include performance-focused tests'
    )
    parser.add_argument(
        '--coverage',
        action='store_true',
        help='Generate coverage report'
    )
    parser.add_argument(
        '--fast',
        action='store_true',
        help='Skip heavy dependencies for faster execution'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Run all test configurations (comprehensive testing)'
    )
    
    args = parser.parse_args()
    
    # Check if we're in the backend directory
    if not Path("app").exists():
        print("❌ Error: This script must be run from the backend directory")
        print("   Make sure you're in: riceguard/backend/")
        sys.exit(1)
    
    print("🚀 RiceGuard Backend Import Test Runner")
    print("=" * 50)
    
    results = []
    
    if args.critical:
        exit_code, stdout, stderr = run_critical_tests()
        results.append(("Critical Tests", exit_code, stdout, stderr))
    
    elif args.ml_only:
        exit_code, stdout, stderr = run_ml_tests()
        results.append(("ML Tests", exit_code, stdout, stderr))
    
    elif args.db_only:
        exit_code, stdout, stderr = run_database_tests()
        results.append(("Database Tests", exit_code, stdout, stderr))
    
    elif args.performance:
        exit_code, stdout, stderr = run_performance_tests()
        results.append(("Performance Tests", exit_code, stdout, stderr))
    
    elif args.coverage:
        exit_code, stdout, stderr = run_with_coverage()
        results.append(("Coverage Tests", exit_code, stdout, stderr))
    
    elif args.fast:
        exit_code, stdout, stderr = run_skip_heavy()
        results.append(("Fast Tests", exit_code, stdout, stderr))
    
    elif args.all:
        # Run comprehensive test suite
        test_configs = [
            ("Critical Tests", lambda: run_critical_tests()),
            ("ML Tests", lambda: run_ml_tests()),
            ("Database Tests", lambda: run_database_tests()),
            ("Performance Tests", lambda: run_performance_tests()),
        ]
        
        for name, func in test_configs:
            exit_code, stdout, stderr = func()
            results.append((name, exit_code, stdout, stderr))
    
    else:
        # Default: run all import tests
        exit_code, stdout, stderr = run_all_import_tests()
        results.append(("All Import Tests", exit_code, stdout, stderr))
    
    # Generate summary report
    success = generate_test_report(results)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()