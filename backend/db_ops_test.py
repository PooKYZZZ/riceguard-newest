#!/usr/bin/env python3
"""
Test database operations
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import init_database, close_database, DatabaseOperations, as_object_id

async def main():
    try:
        print("Testing database operations...")
        await init_database()

        print("[SUCCESS] Database initialized successfully")

        # Test simple insert without session
        test_doc = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "name": "Test User",
            "hashed_password": "test_hash",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        print("Testing insert operation...")
        user_id = await DatabaseOperations.insert_one("users", test_doc)
        print(f"[SUCCESS] Inserted user with ID: {user_id}")

        # Test find operation
        print("Testing find operation...")
        found_user = await DatabaseOperations.find_one("users", {"_id": as_object_id(user_id)})
        if found_user:
            print(f"[SUCCESS] Found user: {found_user['email']}")
        else:
            print("[ERROR] User not found")
            return 1

        # Test count operation
        print("Testing count operation...")
        count = await DatabaseOperations.count_documents("users", {"email": test_doc["email"]})
        print(f"[SUCCESS] User count: {count}")

        # Test update operation
        print("Testing update operation...")
        updated = await DatabaseOperations.update_one(
            "users",
            {"_id": as_object_id(user_id)},
            {"$set": {"name": "Updated Test User", "updated_at": datetime.utcnow()}}
        )
        print(f"[SUCCESS] Update result: {updated}")

        # Test delete operation
        print("Testing delete operation...")
        deleted = await DatabaseOperations.delete_one("users", {"_id": as_object_id(user_id)})
        print(f"[SUCCESS] Delete result: {deleted}")

        print("[SUCCESS] All database operations tests passed!")

    except Exception as e:
        print(f"[ERROR] Database operations test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        await close_database()

    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)