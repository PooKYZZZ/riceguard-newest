import logging
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import contextmanager, asynccontextmanager
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import (
    ConnectionFailure, ServerSelectionTimeoutError,
    OperationFailure, DuplicateKeyError, AutoReconnect,
    ConfigurationError, NetworkTimeout
)
from bson import ObjectId, Timestamp
from app.core.config import settings
import certifi

# Configure logging
logger = logging.getLogger(__name__)

# Global client and database instances
_client: Optional[MongoClient] = None
_db = None

# Connection retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds

class DatabaseError(Exception):
    """Custom database error for better error handling"""
    pass

class ConnectionManager:
    """Manages MongoDB connection lifecycle with proper error handling and retry logic"""

    def __init__(self):
        self._client: Optional[MongoClient] = None
        self._connection_attempts = 0

    async def connect(self) -> MongoClient:
        """Establish MongoDB connection with retry logic and proper configuration"""
        if self._client is not None:
            try:
                # Test existing connection
                self._client.admin.command('ping')
                return self._client
            except (ConnectionFailure, AutoReconnect):
                logger.warning("Existing connection lost, attempting to reconnect...")
                self._client = None

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Attempting to connect to MongoDB (attempt {attempt + 1}/{MAX_RETRIES})")

                # Enhanced connection configuration for MongoDB Atlas
                self._client = MongoClient(
                    settings.MONGO_URI,
                    # Connection configuration
                    uuidRepresentation="standard",
                    tls=True,
                    tlsCAFile=certifi.where(),
                    tlsAllowInvalidCertificates=False,
                    tlsAllowInvalidHostnames=False,

                    # Connection pooling and timeout configuration
                    maxPoolSize=50,  # Maximum number of connections in the pool
                    minPoolSize=5,   # Minimum number of connections to maintain
                    maxIdleTimeMS=30000,  # Close connections after 30 seconds of inactivity
                    waitQueueTimeoutMS=5000,  # How long a thread can wait for a connection
                    connectTimeoutMS=10000,  # How long to attempt a connection before timing out
                    serverSelectionTimeoutMS=8000,  # How long to select a server
                    socketTimeoutMS=20000,  # How long a send or receive on a socket can take
                    heartbeatFrequencyMS=10000,  # Frequency of server monitoring checks

                    # Retry configuration
                    retryWrites=True,
                    retryReads=True,

                    # Application name for monitoring
                    appName="RiceGuard API"
                )

                # Test the connection
                await asyncio.get_event_loop().run_in_executor(
                    None, self._client.admin.command, 'ping'
                )

                # Get server info for logging
                server_info = await asyncio.get_event_loop().run_in_executor(
                    None, self._client.server_info
                )
                logger.info(f"Successfully connected to MongoDB: {server_info.get('version', 'unknown')}")

                self._connection_attempts = 0
                return self._client

            except (ConnectionFailure, ServerSelectionTimeoutError, ConfigurationError) as e:
                self._connection_attempts += 1
                logger.error(f"Connection attempt {attempt + 1} failed: {str(e)}")

                if attempt == MAX_RETRIES - 1:
                    raise DatabaseError(f"Failed to connect to MongoDB after {MAX_RETRIES} attempts: {str(e)}")

                # Exponential backoff
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))

            except Exception as e:
                logger.error(f"Unexpected error during MongoDB connection: {str(e)}")
                raise DatabaseError(f"Failed to connect to MongoDB: {str(e)}")

    async def disconnect(self):
        """Close MongoDB connection gracefully"""
        if self._client:
            try:
                await asyncio.get_event_loop().run_in_executor(
                    None, self._client.close
                )
                logger.info("MongoDB connection closed successfully")
            except Exception as e:
                logger.error(f"Error closing MongoDB connection: {str(e)}")
            finally:
                self._client = None

    def get_client(self) -> MongoClient:
        """Get the MongoDB client instance"""
        if self._client is None:
            raise DatabaseError("Database connection not established. Call connect() first.")
        return self._client

# Global connection manager
connection_manager = ConnectionManager()

async def get_client() -> MongoClient:
    """Get MongoDB client with automatic connection management"""
    return await connection_manager.connect()

def get_db():
    """Get database instance"""
    client = connection_manager.get_client()
    return client[settings.DB_NAME]

async def ensure_indexes():
    """Create database indexes with proper error handling and logging"""
    db = get_db()

    # Index configurations
    indexes = {
        'users': [
            {
                'keys': [("email", ASCENDING)],
                'options': {"unique": True, "name": "uniq_email", "background": True}
            },
            {
                'keys': [("created_at", DESCENDING)],
                'options': {"name": "user_created_at", "background": True}
            }
        ],
        'scans': [
            {
                'keys': [("user_id", ASCENDING), ("created_at", DESCENDING)],
                'options': {"name": "user_scans_created", "background": True}
            },
            {
                'keys': [("primary_disease", ASCENDING)],
                'options': {"name": "disease_index", "background": True}
            },
            {
                'keys': [("confidence", DESCENDING)],
                'options': {"name": "confidence_index", "background": True}
            },
            {
                'keys': [("user_id", ASCENDING), ("primary_disease", ASCENDING)],
                'options': {"name": "user_disease_index", "background": True}
            }
        ]
    }

    try:
        for collection_name, collection_indexes in indexes.items():
            collection = db[collection_name]

            for index_config in collection_indexes:
                try:
                    collection.create_index(
                        index_config['keys'],
                        **index_config['options']
                    )
                    logger.info(f"Created index {index_config['options']['name']} on {collection_name}")
                except Exception as e:
                    if "already exists" in str(e):
                        logger.info(f"Index {index_config['options']['name']} already exists on {collection_name}")
                    else:
                        logger.error(f"Failed to create index {index_config['options']['name']} on {collection_name}: {str(e)}")

        logger.info("Database indexes creation completed")

    except Exception as e:
        logger.error(f"Error creating database indexes: {str(e)}")
        raise DatabaseError(f"Failed to create database indexes: {str(e)}")

def as_object_id(id_str: str) -> ObjectId:
    """Convert string ID to ObjectId with error handling"""
    try:
        return ObjectId(id_str)
    except Exception as e:
        raise DatabaseError(f"Invalid ObjectId: {id_str}") from e

@contextmanager
def get_transaction_session():
    """
    Context manager for MongoDB transactions.
    Usage:
        with get_transaction_session() as session:
            # Perform operations within transaction
            db.users.insert_one(user_data, session=session)
            db.scans.insert_one(scan_data, session=session)
            # If no exception occurs, transaction is committed automatically
    """
    client = connection_manager.get_client()

    # Start session with transaction options
    session = client.start_session(
        causal_consistency=True,
        default_transaction_options={
            'readConcern': {'level': 'snapshot'},
            'writeConcern': {'w': 'majority', 'j': True},
            'readPreference': 'primary'
        }
    )

    try:
        with session.start_transaction():
            yield session
            # Transaction commits automatically when context exits without exception
    except Exception as e:
        # Transaction aborts automatically on exception
        logger.error(f"Transaction failed: {str(e)}")
        raise DatabaseError(f"Transaction failed: {str(e)}") from e
    finally:
        session.end_session()

async def execute_with_retry(operation, *args, max_retries: int = 3, session=None, **kwargs):
    """
    Execute a database operation with automatic retry logic for transient failures.

    Args:
        operation: The database operation function to execute
        *args: Arguments to pass to the operation
        max_retries: Maximum number of retry attempts
        session: MongoDB session for transactions
        **kwargs: Keyword arguments to pass to the operation

    Returns:
        Result of the operation

    Raises:
        DatabaseError: If operation fails after all retries
    """
    last_exception = None

    for attempt in range(max_retries):
        try:
            # If session is provided, add it to kwargs
            if session is not None:
                kwargs['session'] = session

            return await asyncio.get_event_loop().run_in_executor(
                None, operation, *args, **kwargs
            )
        except (AutoReconnect, NetworkTimeout, ConnectionFailure) as e:
            last_exception = e
            logger.warning(f"Operation failed (attempt {attempt + 1}/{max_retries}): {str(e)}")

            if attempt < max_retries - 1:
                # Exponential backoff with jitter
                delay = min(RETRY_DELAY * (2 ** attempt), 10) + (attempt * 0.1)
                await asyncio.sleep(delay)
        except DuplicateKeyError as e:
            # Don't retry duplicate key errors
            raise DatabaseError(f"Duplicate key error: {str(e)}") from e
        except OperationFailure as e:
            # Don't retry operation failures (non-transient)
            raise DatabaseError(f"Operation failed: {str(e)}") from e
        except Exception as e:
            last_exception = e
            logger.error(f"Unexpected error in database operation (attempt {attempt + 1}/{max_retries}): {str(e)}")

            if attempt < max_retries - 1:
                await asyncio.sleep(RETRY_DELAY)

    raise DatabaseError(f"Operation failed after {max_retries} attempts: {str(last_exception)}") from last_exception

class DatabaseOperations:
    """Utility class for common database operations with error handling"""

    @staticmethod
    async def find_one(collection: str, query: Dict[str, Any], **kwargs) -> Optional[Dict[str, Any]]:
        """Find a single document with error handling"""
        db = get_db()
        try:
            return await execute_with_retry(
                db[collection].find_one, query, **kwargs
            )
        except Exception as e:
            logger.error(f"Error finding document in {collection}: {str(e)}")
            raise DatabaseError(f"Error finding document: {str(e)}") from e

    @staticmethod
    async def find_many(collection: str, query: Dict[str, Any], **kwargs) -> List[Dict[str, Any]]:
        """Find multiple documents with error handling"""
        db = get_db()
        try:
            cursor = await execute_with_retry(
                db[collection].find, query, **kwargs
            )
            return list(cursor)
        except Exception as e:
            logger.error(f"Error finding documents in {collection}: {str(e)}")
            raise DatabaseError(f"Error finding documents: {str(e)}") from e

    @staticmethod
    async def insert_one(collection: str, document: Dict[str, Any], session=None) -> str:
        """Insert a single document with error handling"""
        db = get_db()
        try:
            result = await execute_with_retry(
                db[collection].insert_one, document, session=session
            )
            return str(result.inserted_id)
        except DuplicateKeyError as e:
            logger.error(f"Duplicate key error in {collection}: {str(e)}")
            raise DatabaseError(f"Document already exists: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error inserting document in {collection}: {str(e)}")
            raise DatabaseError(f"Error inserting document: {str(e)}") from e

    @staticmethod
    async def update_one(collection: str, query: Dict[str, Any], update: Dict[str, Any], session=None) -> bool:
        """Update a single document with error handling"""
        db = get_db()
        try:
            result = await execute_with_retry(
                db[collection].update_one, query, update, session=session
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating document in {collection}: {str(e)}")
            raise DatabaseError(f"Error updating document: {str(e)}") from e

    @staticmethod
    async def delete_one(collection: str, query: Dict[str, Any], session=None) -> bool:
        """Delete a single document with error handling"""
        db = get_db()
        try:
            result = await execute_with_retry(
                db[collection].delete_one, query, session=session
            )
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting document in {collection}: {str(e)}")
            raise DatabaseError(f"Error deleting document: {str(e)}") from e

    @staticmethod
    async def count_documents(collection: str, query: Dict[str, Any], **kwargs) -> int:
        """Count documents with error handling"""
        db = get_db()
        try:
            return await execute_with_retry(
                db[collection].count_documents, query, **kwargs
            )
        except Exception as e:
            logger.error(f"Error counting documents in {collection}: {str(e)}")
            raise DatabaseError(f"Error counting documents: {str(e)}") from e

# Convenience functions for backward compatibility
async def ping_database() -> bool:
    """Test database connectivity"""
    try:
        client = await get_client()
        await asyncio.get_event_loop().run_in_executor(
            None, client.admin.command, 'ping'
        )
        logger.info("Database ping successful")
        return True
    except Exception as e:
        logger.error(f"Database ping failed: {str(e)}")
        return False

async def get_database_stats() -> Dict[str, Any]:
    """Get database statistics for monitoring"""
    try:
        db = get_db()
        stats = await asyncio.get_event_loop().run_in_executor(
            None, db.command, 'dbStats'
        )
        return stats
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return {}

# Application lifecycle functions
async def init_database():
    """Initialize database connection and indexes"""
    try:
        logger.info("Initializing database connection...")
        await get_client()
        await ensure_indexes()
        await ping_database()
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

async def close_database():
    """Close database connection"""
    await connection_manager.disconnect()