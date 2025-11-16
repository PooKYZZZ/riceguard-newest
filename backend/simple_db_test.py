#!/usr/bin/env python3
"""
Simple database connection test
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import init_database, close_database, ping_database, get_database_stats

async def main():
    try:
        print("Testing database connection...")
        await init_database()

        print("[SUCCESS] Database initialized successfully")

        # Test ping
        is_connected = await ping_database()
        print(f"[SUCCESS] Database ping: {'Connected' if is_connected else 'Disconnected'}")

        # Get stats
        stats = await get_database_stats()
        print(f"[SUCCESS] Database stats: {stats}")

        print("[SUCCESS] All basic database tests passed!")

    except Exception as e:
        print(f"[ERROR] Database test failed: {str(e)}")
        return 1

    finally:
        await close_database()

    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)