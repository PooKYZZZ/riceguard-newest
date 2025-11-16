// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to riceguard_db database
db = db.getSiblingDB('riceguard_db');

// Create application user
db.createUser({
  user: 'riceguard_user',
  pwd: 'riceguard_password',
  roles: [
    {
      role: 'readWrite',
      db: 'riceguard_db'
    }
  ]
});

// Create collections and indexes
db.createCollection('users');
db.createCollection('scans');
db.createCollection('recommendations');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "created_at": -1 });

db.scans.createIndex({ "user_id": 1 });
db.scans.createIndex({ "created_at": -1 });
db.scans.createIndex({ "disease_predicted": 1 });

db.recommendations.createIndex({ "disease_key": 1 }, { unique: true });

print('MongoDB initialization completed for RiceGuard');