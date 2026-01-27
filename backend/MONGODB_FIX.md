# MongoDB User Registration - Setup & Testing Guide

## Overview
This guide explains the fixes applied to the MongoDB connection and user registration system in SnapShroom.

## Changes Made

### 1. **Enhanced auth_service.py**
Added comprehensive error handling and logging for MongoDB operations:
- Proper `ObjectId` handling for user IDs
- Case-insensitive email and username lookups
- Detailed error messages for duplicate users
- Improved logging for debugging
- Transaction safety with DuplicateKeyError handling
- Added helper function `user_exists()` for checking duplicates

**Key Features:**
- Stores both original and lowercase versions of email/username for proper duplicate detection
- Validates and sanitizes user input
- Proper error propagation for client-side handling
- Comprehensive logging for monitoring

### 2. **Improved auth_routes.py**
Updated the registration endpoint to handle errors properly:
- Removed redundant duplicate checking (handled in service layer)
- Better error response mapping (409 for conflicts, 400 for validation)
- Improved error messages
- Added null checks for safety
- Proper token generation and user data serialization

### 3. **Better app.py MongoDB Initialization**
Enhanced database initialization:
- Improved error handling for MongoDB connection
- Better logging of collection and index creation
- Check for existing indexes before creating (prevents errors)
- Detailed console output for debugging
- Graceful handling of connection failures

### 4. **Updated requirements.txt**
Added missing critical dependencies:
- `flask-jwt-extended` - For JWT token management
- `flask-pymongo` - For Flask/MongoDB integration
- `pymongo` - MongoDB Python driver
- `python-dotenv` - For environment variable loading

## Setup Instructions

### Prerequisites
- Python 3.8+
- MongoDB running locally or accessible via URI
- pip package manager

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a `.env` file in the backend directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/snapshroom_db
MONGO_DBNAME=snapshroom_db

# Server Configuration
HOST=0.0.0.0
PORT=5000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,exp://*

# Feature Flags
ENABLE_REGISTRATION=True
ENABLE_EMAIL_VERIFICATION=False
```

### Step 3: Ensure MongoDB is Running
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
mongod
```

Verify MongoDB connection:
```bash
mongo localhost:27017
```

### Step 4: Start the Backend Server
```bash
cd backend
python app.py
```

You should see output like:
```
==================================================
🚀 Starting SnapShroom Backend Server
==================================================

📋 Configuration:
   Environment: development
   Host: 0.0.0.0
   Port: 5000
   Debug: True
   Database: snapshroom_db

✅ Connected to MongoDB database: snapshroom_db

📊 Initializing Database Collections...
   ✅ Created collection: users
   ✅ Created unique index on email
   ✅ Created unique index on username
   ✅ Created index on created_at
   ✅ Created index on email_verified
✅ Database initialization completed

✅ SnapShroom API initialized successfully!
```

## Testing the Registration System

### Option 1: Using the Automated Test Script

Run the comprehensive test suite:
```bash
python test_registration.py
```

This tests:
- ✅ User registration
- ✅ Duplicate user prevention
- ✅ User login
- ✅ Invalid credentials handling
- ✅ Input validation

### Option 2: Manual Testing with curl

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'
```

Expected response (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "name": "Test User",
    "created_at": "2026-01-27T10:30:45.123456",
    "avatar": null,
    "subscription": {
      "type": "free"
    },
    "preferences": {
      "notifications": true,
      "email_updates": true
    }
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Login with registered credentials:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Try registering duplicate email:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "differentuser",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

Expected response (409 Conflict):
```json
{
  "error": "Email already exists"
}
```

### Option 3: Using Postman or Insomnia

Import these endpoints:

**Register:** `POST http://localhost:5000/api/auth/register`
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "name": "New User"
}
```

**Login:** `POST http://localhost:5000/api/auth/login`
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123"
}
```

## Troubleshooting

### MongoDB Connection Error
**Error:** `MongoDB connection failed: [Errno 111] Connection refused`

**Solution:**
1. Verify MongoDB is running: `mongod --version`
2. Start MongoDB service (see instructions above)
3. Check connection string in `.env` file
4. Verify MongoDB is listening on `localhost:27017`

### Duplicate Key Error on Registration
**Error:** `E11000 duplicate key error`

**Solution:**
- The indexes ensure unique emails and usernames
- Make sure you're registering with different email/username
- Check MongoDB collections: `db.users.find()` to see existing users
- Clear test users if needed: `db.users.deleteMany({email: "test@example.com"})`

### Port Already in Use
**Error:** `Address already in use`

**Solution:**
1. Find process using port 5000: `lsof -i :5000`
2. Kill the process: `kill -9 <PID>`
3. Or change PORT in `.env`: `PORT=5001`

### JWT Token Not Working
**Error:** `Invalid token` when accessing protected endpoints

**Solution:**
1. Ensure `JWT_SECRET_KEY` is set in `.env`
2. Include token in Authorization header: `Authorization: Bearer <token>`
3. Check token hasn't expired (default 1 day)

## Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "username": "lowercase_username",
  "username_original": "Original Username",
  "email": "lowercase@email.com",
  "email_original": "original@email.com",
  "name": "Display Name",
  "password_hash": "hashed_password",
  "is_active": true,
  "email_verified": false,
  "created_at": ISODate,
  "updated_at": ISODate,
  "subscription": {
    "type": "free"
  },
  "preferences": {
    "notifications": true,
    "email_updates": true
  },
  "profile": {
    "avatar": null,
    "bio": null
  }
}
```

### Indexes Created
- `email` (unique, sparse)
- `username` (unique, sparse)
- `created_at` (descending)
- `email_verified`

## API Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 201 | User registered successfully | Registration endpoint |
| 200 | Login successful | Login endpoint |
| 400 | Validation error | Missing fields, invalid format |
| 401 | Invalid credentials | Wrong password/email |
| 409 | Duplicate user | Email or username exists |
| 500 | Server error | Database connection issue |

## Next Steps

1. **Email Verification**: Enable `ENABLE_EMAIL_VERIFICATION` in `.env` and implement email sending
2. **Password Reset**: Implement password reset flow
3. **Profile Updates**: Add user profile update endpoint
4. **User Deletion**: Add user account deletion endpoint
5. **Rate Limiting**: Enable `RATELIMIT_ENABLED` to prevent abuse

## Additional Resources

- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [Flask Error Handling](https://flask.palletsprojects.com/en/latest/errorhandling/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `logs/snapshroom.log`
3. Test with `test_registration.py` to isolate the issue
4. Check MongoDB collections: `db.users.find().pretty()`
