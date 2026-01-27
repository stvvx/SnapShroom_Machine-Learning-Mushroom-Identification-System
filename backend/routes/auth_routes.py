from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, 
    get_jwt_identity, 
    create_access_token,
    create_refresh_token,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
from datetime import datetime, timedelta
from bson import ObjectId
import re
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Validation functions
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    return True, ""

def validate_username(username):
    """Validate username"""
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be less than 30 characters"
    if not username.replace("_", "").replace("-", "").isalnum():
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    return True, ""

# Auth service functions (replacing missing imports)
def register_user(mongo, username, email, password, name=None):
    """Register a new user"""
    users = mongo.db.users
    
    # Create user document
    user_data = {
        "username": username,
        "email": email,
        "name": name or username,
        "password_hash": generate_password_hash(password),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "is_verified": False,
        "subscription": {"type": "free"},
        "preferences": {
            "notifications": True,
            "email_updates": True
        }
    }
    
    try:
        result = users.insert_one(user_data)
        return result.inserted_id
    except Exception as e:
        current_app.logger.error(f"Error registering user: {str(e)}")
        return None

def login_user(mongo, email, password):
    """Authenticate user"""
    try:
        user = mongo.db.users.find_one({"email": email, "is_active": True})
        if user and check_password_hash(user["password_hash"], password):
            # Update last login
            mongo.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            return user["_id"]
        return None
    except Exception as e:
        current_app.logger.error(f"Error logging in user: {str(e)}")
        return None

def get_user_by_id(mongo, user_id):
    """Get user by ID"""
    try:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        user = mongo.db.users.find_one({"_id": user_id, "is_active": True})
        
        # Remove sensitive data
        if user and 'password_hash' in user:
            del user['password_hash']
        return user
    except Exception as e:
        current_app.logger.error(f"Error getting user by ID: {str(e)}")
        return None

def update_user_profile(mongo, user_id, update_data):
    """Update user profile"""
    try:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = mongo.db.users.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        current_app.logger.error(f"Error updating user profile: {str(e)}")
        return False

def hash_password(password):
    """Hash password"""
    return generate_password_hash(password)

def verify_password(hashed_password, password):
    """Verify password"""
    return check_password_hash(hashed_password, password)

def generate_token(user_id, expires_delta=None):
    """Generate JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(hours=1)
    return create_access_token(identity=str(user_id), expires_delta=expires_delta)

def generate_refresh_token(user_id):
    """Generate refresh token"""
    return create_refresh_token(identity=str(user_id))

def verify_refresh_token(refresh_token):
    """Verify refresh token - simplified version"""
    try:
        from flask_jwt_extended import decode_token
        decoded = decode_token(refresh_token)
        return decoded['sub']
    except Exception as e:
        current_app.logger.error(f"Error verifying refresh token: {str(e)}")
        return None

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    mongo = current_app.mongo

    # Validate required fields
    required_fields = ["username", "email", "password"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    username = data["username"].strip()
    email = data["email"].strip().lower()
    password = data["password"]

    # Validate input
    username_valid, username_error = validate_username(username)
    if not username_valid:
        return jsonify({"error": username_error}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    password_valid, password_error = validate_password(password)
    if not password_valid:
        return jsonify({"error": password_error}), 400

    # Optional fields
    name = data.get("name", username)
    
    try:
        # Check if user already exists
        existing_user = mongo.db.users.find_one({
            "$or": [
                {"email": email},
                {"username": username}
            ]
        })
        
        if existing_user:
            field = "email" if existing_user["email"] == email else "username"
            return jsonify({"error": f"{field.capitalize()} already exists"}), 409

        # Register user
        user_id = register_user(mongo, username, email, password, name)
        
        if not user_id:
            return jsonify({"error": "Registration failed"}), 500

        # Generate tokens
        access_token = create_access_token(identity=str(user_id))
        refresh_token = create_refresh_token(identity=str(user_id))

        # Get user data (excluding password)
        user = mongo.db.users.find_one({"_id": user_id})
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "avatar": user.get("avatar"),
            "subscription": user.get("subscription", {"type": "free"}),
            "preferences": user.get("preferences", {
                "notifications": True,
                "email_updates": True
            })
        }

        response = jsonify({
            "message": "User registered successfully",
            "user": user_data,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

        # Set HTTP-only cookies (optional, for web)
        # set_access_cookies(response, access_token)
        # set_refresh_cookies(response, refresh_token)
        
        return response

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    mongo = current_app.mongo

    # Validate required fields
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing email or password"}), 400

    email = data["email"].strip().lower()
    password = data["password"]

    try:
        # Attempt login
        user_id = login_user(mongo, email, password)

        if not user_id:
            return jsonify({"error": "Invalid credentials"}), 401

        # Generate tokens
        access_token = create_access_token(identity=str(user_id))
        refresh_token = create_refresh_token(identity=str(user_id))

        # Get user data (excluding password)
        user = mongo.db.users.find_one({"_id": user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "avatar": user.get("avatar"),
            "subscription": user.get("subscription", {"type": "free"}),
            "preferences": user.get("preferences", {
                "notifications": True,
                "email_updates": True
            })
        }

        response = jsonify({
            "message": "Login successful",
            "user": user_data,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

        # Set HTTP-only cookies (optional, for web)
        # set_access_cookies(response, access_token)
        # set_refresh_cookies(response, refresh_token)
        
        return response

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Refresh access token using refresh token"""
    try:
        data = request.json
        if not data or "refresh_token" not in data:
            return jsonify({"error": "Refresh token required"}), 400

        refresh_token = data["refresh_token"]
        user_id = verify_refresh_token(refresh_token)

        if not user_id:
            return jsonify({"error": "Invalid refresh token"}), 401

        # Generate new access token
        new_access_token = create_access_token(identity=user_id)
        
        return jsonify({
            "access_token": new_access_token
        }), 200

    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({"error": "Token refresh failed"}), 500


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout user (client should delete token)"""
    try:
        jti = get_jwt()["jti"]
        # In production: Add token to blacklist if using token revocation
        # current_app.redis.setex(jti, timedelta(hours=24), "revoked")
        
        response = jsonify({"message": "Logged out successfully"}), 200
        
        # Clear cookies if using them
        # unset_jwt_cookies(response)
        
        return response
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({"error": "Logout failed"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        user = get_user_by_id(mongo, ObjectId(user_id))
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "name": user.get("name", user["username"]),
                "avatar": user.get("avatar"),
                "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
                "subscription": user.get("subscription", {"type": "free"}),
                "preferences": user.get("preferences", {
                    "notifications": True,
                    "email_updates": True
                }),
                "last_login": user.get("last_login", ""),
                "is_verified": user.get("is_verified", False)
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Profile error: {str(e)}")
        return jsonify({"error": "Failed to fetch profile"}), 500


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo

        # Fields that can be updated
        updatable_fields = ["name", "avatar", "preferences"]
        update_data = {}
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]

        # If updating email or username, check for duplicates
        if "email" in data:
            email = data["email"].strip().lower()
            if not validate_email(email):
                return jsonify({"error": "Invalid email format"}), 400
            
            existing = mongo.db.users.find_one({
                "email": email,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing:
                return jsonify({"error": "Email already in use"}), 409
            update_data["email"] = email

        if "username" in data:
            username = data["username"].strip()
            username_valid, username_error = validate_username(username)
            if not username_valid:
                return jsonify({"error": username_error}), 400
            
            existing = mongo.db.users.find_one({
                "username": username,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing:
                return jsonify({"error": "Username already in use"}), 409
            update_data["username"] = username

        # Update password separately (requires old password)
        if "password" in data:
            if "old_password" not in data:
                return jsonify({"error": "Old password required"}), 400
            
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if not user or not check_password_hash(user["password_hash"], data["old_password"]):
                return jsonify({"error": "Old password is incorrect"}), 401
            
            password_valid, password_error = validate_password(data["password"])
            if not password_valid:
                return jsonify({"error": password_error}), 400
            
            update_data["password_hash"] = generate_password_hash(data["password"])

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        # Update user
        success = update_user_profile(mongo, ObjectId(user_id), update_data)
        
        if not success:
            return jsonify({"error": "Failed to update profile"}), 500

        # Get updated user
        updated_user = get_user_by_id(mongo, ObjectId(user_id))
        
        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": str(updated_user["_id"]),
                "username": updated_user["username"],
                "email": updated_user["email"],
                "name": updated_user.get("name", updated_user["username"]),
                "avatar": updated_user.get("avatar"),
                "subscription": updated_user.get("subscription", {"type": "free"}),
                "preferences": updated_user.get("preferences", {
                    "notifications": True,
                    "email_updates": True
                })
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Profile update error: {str(e)}")
        return jsonify({"error": "Failed to update profile"}), 500


@auth_bp.route("/check-username/<username>", methods=["GET"])
def check_username(username):
    """Check if username is available"""
    try:
        mongo = current_app.mongo
        username = username.strip()
        
        username_valid, username_error = validate_username(username)
        if not username_valid:
            return jsonify({"available": False, "message": username_error}), 200
        
        existing = mongo.db.users.find_one({"username": username})
        
        return jsonify({
            "available": existing is None,
            "message": "Username is available" if existing is None else "Username already taken"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Username check error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/check-email/<email>", methods=["GET"])
def check_email(email):
    """Check if email is available"""
    try:
        mongo = current_app.mongo
        email = email.strip().lower()
        
        if not validate_email(email):
            return jsonify({"available": False, "message": "Invalid email format"}), 200
        
        existing = mongo.db.users.find_one({"email": email})
        
        return jsonify({
            "available": existing is None,
            "message": "Email is available" if existing is None else "Email already registered"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Email check error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate password reset (send reset email)"""
    try:
        data = request.json
        if not data or "email" not in data:
            return jsonify({"error": "Email required"}), 400
        
        email = data["email"].strip().lower()
        mongo = current_app.mongo
        
        # Check if user exists
        user = mongo.db.users.find_one({"email": email})
        
        # Always return success to prevent email enumeration
        if user:
            # Generate reset token
            reset_token = create_access_token(
                identity=str(user["_id"]),
                expires_delta=timedelta(hours=1)
            )
            
            # In production: Send email with reset link
            # send_reset_email(user["email"], reset_token)
            
            current_app.logger.info(f"Password reset token for {email}: {reset_token}")
        
        return jsonify({
            "message": "If an account exists with this email, you will receive reset instructions"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Forgot password error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using reset token"""
    try:
        data = request.json
        required = ["token", "new_password"]
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        reset_token = data["token"]
        new_password = data["new_password"]
        
        try:
            # Decode token to get user ID
            from flask_jwt_extended import decode_token
            decoded = decode_token(reset_token)
            user_id = decoded['sub']
        except Exception as e:
            current_app.logger.error(f"Invalid reset token: {str(e)}")
            return jsonify({"error": "Invalid or expired reset token"}), 401
        
        # Validate new password
        password_valid, password_error = validate_password(new_password)
        if not password_valid:
            return jsonify({"error": password_error}), 400
        
        mongo = current_app.mongo
        
        # Update password
        update_data = {
            "password_hash": generate_password_hash(new_password),
            "updated_at": datetime.utcnow()
        }
        
        result = mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Failed to reset password"}), 500
        
        return jsonify({"message": "Password reset successfully"}), 200
        
    except Exception as e:
        current_app.logger.error(f"Reset password error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# Additional endpoints
@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    """Verify user email (mock implementation)"""
    try:
        data = request.json
        if not data or "token" not in data:
            return jsonify({"error": "Verification token required"}), 400
        
        token = data["token"]
        
        # In production: Verify email token
        # For now, mock verification
        return jsonify({
            "message": "Email verified successfully",
            "verified": True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Email verification error: {str(e)}")
        return jsonify({"error": "Email verification failed"}), 500


@auth_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_user_stats():
    """Get user statistics"""
    try:
        user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        # Mock stats - in production, calculate from user's identifications
        stats = {
            "identifications": 0,
            "correct_identifications": 0,
            "favorite_species": [],
            "total_identifications": 0,
            "accuracy_rate": 0
        }
        
        return jsonify({"stats": stats}), 200
        
    except Exception as e:
        current_app.logger.error(f"Stats error: {str(e)}")
        return jsonify({"error": "Failed to get stats"}), 500


@auth_bp.route("/health", methods=["GET"])
def auth_health():
    """Auth service health check"""
    try:
        mongo = current_app.mongo
        # Test database connection
        mongo.db.command('ping')
        
        return jsonify({
            "status": "healthy",
            "service": "auth",
            "timestamp": datetime.utcnow().isoformat(),
            "endpoints": [
                "/auth/register",
                "/auth/login",
                "/auth/logout",
                "/auth/me",
                "/auth/refresh",
                "/auth/forgot-password",
                "/auth/reset-password"
            ]
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "service": "auth",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 503


# Error handler for auth routes
@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Auth endpoint not found"}), 404


@auth_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed for this endpoint"}), 405