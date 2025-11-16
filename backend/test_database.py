#!/usr/bin/env python3
"""
Database connectivity and operations test script.
Tests the enhanced MongoDB Atlas connection and database operations.
"""

import asyncio
import sys
import os
import logging
from datetime import datetime
from typing import Dict, Any

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import (
    init_database, close_database, ping_database, get_database_stats,
    DatabaseOperations, DatabaseError, as_object_id
)
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseTestSuite:
    """Test suite for database connectivity and operations"""

    def __init__(self):
        self.test_results = []
        self.test_data = {}

    async def run_test(self, test_name: str, test_func) -> bool:
        """Run a test and log the result"""
        logger.info(f"Running test: {test_name}")
        start_time = datetime.utcnow()

        try:
            result = await test_func()
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            self.test_results.append({
                "test_name": test_name,
                "status": "PASSED",
                "duration": duration,
                "timestamp": end_time
            })

            logger.info(f"✅ {test_name} - PASSED ({duration:.2f}s)")
            return True

        except Exception as e:
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            self.test_results.append({
                "test_name": test_name,
                "status": "FAILED",
                "error": str(e),
                "duration": duration,
                "timestamp": end_time
            })

            logger.error(f"❌ {test_name} - FAILED ({duration:.2f}s): {str(e)}")
            return False

    async def test_database_connection(self):
        """Test basic database connection"""
        # Test ping
        is_connected = await ping_database()
        if not is_connected:
            raise Exception("Database ping failed")

        # Get database stats
        stats = await get_database_stats()
        if not stats:
            raise Exception("Failed to get database stats")

        logger.info(f"Database stats: {stats}")
        return True

    async def test_user_operations(self):
        """Test user CRUD operations"""
        test_email = f"test_user_{datetime.utcnow().timestamp()}@example.com"
        test_user_data = {
            "email": test_email,
            "name": "Test User",
            "hashed_password": "test_password_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Create user
        user_id = await DatabaseOperations.insert_one("users", test_user_data)
        self.test_data["test_user_id"] = user_id

        # Find user
        found_user = await DatabaseOperations.find_one("users", {"_id": as_object_id(user_id)})
        if not found_user:
            raise Exception("Failed to find created user")

        if found_user["email"] != test_email:
            raise Exception("Found user email doesn't match")

        # Update user
        update_data = {"name": "Updated Test User", "updated_at": datetime.utcnow()}
        updated = await DatabaseOperations.update_one(
            "users",
            {"_id": as_object_id(user_id)},
            {"$set": update_data}
        )
        if not updated:
            raise Exception("Failed to update user")

        # Count users
        count = await DatabaseOperations.count_documents("users", {"email": test_email})
        if count != 1:
            raise Exception(f"Expected 1 user, found {count}")

        return True

    async def test_scan_operations(self):
        """Test scan CRUD operations"""
        if "test_user_id" not in self.test_data:
            raise Exception("Test user not found - run user operations first")

        test_scan_data = {
            "user_id": self.test_data["test_user_id"],
            "image_url": "/uploads/test_image.jpg",
            "original_filename": "test_image.jpg",
            "predictions": [
                {"disease": "healthy", "confidence": 0.95, "description": "Healthy leaf"},
                {"disease": "bacterial_blight", "confidence": 0.05, "description": "Bacterial blight"}
            ],
            "primary_disease": "healthy",
            "confidence": 0.95,
            "notes": "Test scan",
            "model_version": "1.0",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Create scan
        scan_id = await DatabaseOperations.insert_one("scans", test_scan_data)
        self.test_data["test_scan_id"] = scan_id

        # Find scan
        found_scan = await DatabaseOperations.find_one(
            "scans",
            {"_id": as_object_id(scan_id)}
        )
        if not found_scan:
            raise Exception("Failed to find created scan")

        if found_scan["user_id"] != self.test_data["test_user_id"]:
            raise Exception("Found scan user_id doesn't match")

        # Test pagination
        scans = await DatabaseOperations.find_many(
            "scans",
            {"user_id": self.test_data["test_user_id"]},
            sort=[("created_at", -1)],
            limit=10
        )
        if len(scans) == 0:
            raise Exception("No scans found for test user")

        return True

    async def test_index_operations(self):
        """Test that indexes are working properly"""
        # This is a basic test - in production you'd want more comprehensive index testing
        logger.info("Testing index operations...")

        # Try to create a duplicate user to test unique index
        if "test_user_id" in self.test_data:
            test_user = await DatabaseOperations.find_one(
                "users",
                {"_id": as_object_id(self.test_data["test_user_id"])}
            )
            if test_user:
                try:
                    await DatabaseOperations.insert_one("users", {
                        "email": test_user["email"],  # Same email to trigger unique index
                        "name": "Duplicate User",
                        "hashed_password": "test_password_hash",
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                    raise Exception("Unique index test failed - duplicate email was allowed")
                except DatabaseError:
                    # Expected behavior - unique index should prevent duplicate
                    pass

        return True

    async def test_error_handling(self):
        """Test error handling for invalid operations"""
        # Test invalid ObjectId
        try:
            as_object_id("invalid_id")
            raise Exception("Should have raised DatabaseError for invalid ObjectId")
        except DatabaseError:
            pass  # Expected

        # Test find non-existent document
        non_existent = await DatabaseOperations.find_one(
            "users",
            {"_id": as_object_id("507f1f77bcf86cd799439011")}  # Valid but non-existent ObjectId
        )
        if non_existent is not None:
            raise Exception("Should have returned None for non-existent document")

        return True

    async def cleanup_test_data(self):
        """Clean up test data"""
        logger.info("Cleaning up test data...")

        if "test_scan_id" in self.test_data:
            try:
                await DatabaseOperations.delete_one(
                    "scans",
                    {"_id": as_object_id(self.test_data["test_scan_id"])}
                )
            except Exception as e:
                logger.warning(f"Failed to delete test scan: {str(e)}")

        if "test_user_id" in self.test_data:
            try:
                await DatabaseOperations.delete_one(
                    "users",
                    {"_id": as_object_id(self.test_data["test_user_id"])}
                )
            except Exception as e:
                logger.warning(f"Failed to delete test user: {str(e)}")

    async def run_all_tests(self):
        """Run all database tests"""
        logger.info("Starting database connectivity and operations tests")
        logger.info(f"Testing against MongoDB URI: {settings.MONGO_URI[:20]}...")  # Log partial URI for security

        tests = [
            ("Database Connection", self.test_database_connection),
            ("User Operations", self.test_user_operations),
            ("Scan Operations", self.test_scan_operations),
            ("Index Operations", self.test_index_operations),
            ("Error Handling", self.test_error_handling),
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            if await self.run_test(test_name, test_func):
                passed += 1

        # Cleanup
        await self.cleanup_test_data()

        # Print summary
        logger.info("\n" + "="*50)
        logger.info("DATABASE TEST SUMMARY")
        logger.info("="*50)
        logger.info(f"Total Tests: {total}")
        logger.info(f"Passed: {passed}")
        logger.info(f"Failed: {total - passed}")
        logger.info(f"Success Rate: {(passed/total)*100:.1f}%")

        # Print detailed results
        logger.info("\nDetailed Results:")
        for result in self.test_results:
            status_icon = "✅" if result["status"] == "PASSED" else "❌"
            logger.info(f"{status_icon} {result['test_name']} - {result['status']} ({result['duration']:.2f}s)")
            if result["status"] == "FAILED":
                logger.info(f"   Error: {result['error']}")

        return passed == total

async def main():
    """Main test function"""
    try:
        # Initialize database
        logger.info("Initializing database connection...")
        await init_database()

        # Run tests
        test_suite = DatabaseTestSuite()
        success = await test_suite.run_all_tests()

        if success:
            logger.info("\n🎉 All database tests passed!")
            return 0
        else:
            logger.error("\n💥 Some database tests failed!")
            return 1

    except Exception as e:
        logger.error(f"Test suite failed: {str(e)}")
        return 1

    finally:
        # Close database connection
        await close_database()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)