from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, 
    get_jwt_identity, 
    create_access_token,
    create_refresh_token,
    get_jwt,
    decode_token
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

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        mongo = current_app.mongo
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        # Validate required fields
        required_fields = ["email", "password", "username"]
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400

        username = data["username"].strip()
        email = data["email"].strip().lower()
        password = data["password"]
        name = data.get("name", username)
        confirm_password = data.get("confirm_password")

        # Validate input
        username_valid, username_error = validate_username(username)
        if not username_valid:
            return jsonify({
                "success": False,
                "message": username_error
            }), 400

        if not validate_email(email):
            return jsonify({
                "success": False,
                "message": "Invalid email format"
            }), 400

        password_valid, password_error = validate_password(password)
        if not password_valid:
            return jsonify({
                "success": False,
                "message": password_error
            }), 400

        # Check password confirmation if provided
        if confirm_password and password != confirm_password:
            return jsonify({
                "success": False,
                "message": "Passwords do not match"
            }), 400

        # Check if user already exists
        existing_user = mongo.db.users.find_one({
            "$or": [
                {"email": email},
                {"username": username}
            ]
        })
        
        if existing_user:
            field = "email" if existing_user.get("email") == email else "username"
            return jsonify({
                "success": False,
                "message": f"{field.capitalize()} already exists"
            }), 409

        # Create user document
        user_data = {
            "username": username,
            "email": email,
            "name": name,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "is_verified": False,
            "role": "user",
            "subscription": {"type": "free"},
            "preferences": {
                "notifications": True,
                "email_updates": True
            },
            "last_login": None,
            "avatar": None,
            "identification_history": []
        }
        
        # Insert user
        result = mongo.db.users.insert_one(user_data)
        user_id = result.inserted_id
        
        # Generate tokens
        access_token = create_access_token(
            identity=str(user_id),
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(identity=str(user_id))

        # Get user data (excluding password)
        user = mongo.db.users.find_one({"_id": user_id})
        
        user_data_response = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user["name"],
            "email_verified": user.get("is_verified", False),
            "role": user.get("role", "user"),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "avatar": user.get("avatar"),
            "subscription": user.get("subscription", {"type": "free"}),
            "preferences": user.get("preferences", {
                "notifications": True,
                "email_updates": True
            })
        }

        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user": user_data_response,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user"""
    try:
        data = request.get_json()
        mongo = current_app.mongo
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        # Validate required fields
        if "email" not in data or "password" not in data:
            return jsonify({
                "success": False,
                "message": "Missing email or password"
            }), 400

        email = data["email"].strip().lower()
        password = data["password"]

        # Find user
        user = mongo.db.users.find_one({
            "email": email,
            "is_active": True
        })
        
        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # Check password
        if not check_password_hash(user["password_hash"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # Update last login
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        # Generate tokens
        access_token = create_access_token(
            identity=str(user["_id"]),
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(identity=str(user["_id"]))

        # Prepare user data
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
            "email_verified": user.get("is_verified", False),
            "role": user.get("role", "user"),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "avatar": user.get("avatar"),
            "subscription": user.get("subscription", {"type": "free"}),
            "preferences": user.get("preferences", {
                "notifications": True,
                "email_updates": True
            }),
            "last_login": user.get("last_login", ""),
            "is_active": user.get("is_active", True)
        }

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": user_data,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        }), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        if not data or "refresh_token" not in data:
            return jsonify({
                "success": False,
                "message": "Refresh token required"
            }), 400

        refresh_token = data["refresh_token"]
        
        try:
            # Decode refresh token
            decoded = decode_token(refresh_token)
            user_id = decoded['sub']
            
            # Verify user exists and is active
            mongo = current_app.mongo
            user = mongo.db.users.find_one({
                "_id": ObjectId(user_id),
                "is_active": True
            })
            
            if not user:
                return jsonify({
                    "success": False,
                    "message": "User not found or inactive"
                }), 401
            
            # Generate new access token
            new_access_token = create_access_token(
                identity=user_id,
                expires_delta=timedelta(hours=24)
            )
            
            return jsonify({
                "success": True,
                "access_token": new_access_token
            }), 200
            
        except Exception as decode_error:
            current_app.logger.error(f"Token decode error: {str(decode_error)}")
            return jsonify({
                "success": False,
                "message": "Invalid refresh token"
            }), 401

    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Token refresh failed"
        }), 500


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout user"""
    try:
        # Get token and add to blacklist if needed
        jti = get_jwt()["jti"]
        
        # In production: Add token to blacklist
        # current_app.redis.setex(jti, timedelta(hours=24), "revoked")
        
        return jsonify({
            "success": True,
            "message": "Logged out successfully"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Logout failed"
        }), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        user = mongo.db.users.find_one({
            "_id": ObjectId(user_id),
            "is_active": True
        })
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"]),
            "avatar": user.get("avatar"),
            "email_verified": user.get("is_verified", False),
            "role": user.get("role", "user"),
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "subscription": user.get("subscription", {"type": "free"}),
            "preferences": user.get("preferences", {
                "notifications": True,
                "email_updates": True
            }),
            "last_login": user.get("last_login", ""),
            "is_active": user.get("is_active", True)
        }

        return jsonify({
            "success": True,
            "user": user_data
        }), 200

    except Exception as e:
        current_app.logger.error(f"Profile error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to fetch profile"
        }), 500


@auth_bp.route("/check-availability", methods=["POST"])
def check_availability():
    """Check if username or email is available"""
    try:
        data = request.get_json()
        mongo = current_app.mongo
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400
        
        result = {"available": True, "messages": []}
        
        # Check username
        if "username" in data:
            username = data["username"].strip()
            username_valid, username_error = validate_username(username)
            
            if not username_valid:
                result["available"] = False
                result["messages"].append(f"Username: {username_error}")
            else:
                existing = mongo.db.users.find_one({"username": username})
                if existing:
                    result["available"] = False
                    result["messages"].append("Username already taken")
        
        # Check email
        if "email" in data:
            email = data["email"].strip().lower()
            if not validate_email(email):
                result["available"] = False
                result["messages"].append("Invalid email format")
            else:
                existing = mongo.db.users.find_one({"email": email})
                if existing:
                    result["available"] = False
                    result["messages"].append("Email already registered")
        
        return jsonify({
            "success": True,
            "available": result["available"],
            "messages": result["messages"]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Availability check error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate password reset"""
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({
                "success": False,
                "message": "Email required"
            }), 400
        
        email = data["email"].strip().lower()
        mongo = current_app.mongo
        
        # Check if user exists
        user = mongo.db.users.find_one({
            "email": email,
            "is_active": True
        })
        
        # Always return success to prevent email enumeration
        if user:
            # Generate reset token (valid for 1 hour)
            reset_token = create_access_token(
                identity=str(user["_id"]),
                expires_delta=timedelta(hours=1)
            )
            
            # In production: Send email with reset link
            # send_reset_email(user["email"], reset_token)
            
            current_app.logger.info(f"Password reset token generated for {email}")
            
            # For development/testing, include token in response
            return jsonify({
                "success": True,
                "message": "If an account exists with this email, you will receive reset instructions",
                "reset_token": reset_token  # Remove in production
            }), 200
        else:
            # Still return success to prevent email enumeration
            return jsonify({
                "success": True,
                "message": "If an account exists with this email, you will receive reset instructions"
            }), 200
        
    except Exception as e:
        current_app.logger.error(f"Forgot password error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using reset token"""
    try:
        data = request.get_json()
        required = ["token", "new_password"]
        for field in required:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        reset_token = data["token"]
        new_password = data["new_password"]
        
        try:
            # Decode token to get user ID
            decoded = decode_token(reset_token)
            user_id = decoded['sub']
        except Exception as e:
            current_app.logger.error(f"Invalid reset token: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Invalid or expired reset token"
            }), 401
        
        # Validate new password
        password_valid, password_error = validate_password(new_password)
        if not password_valid:
            return jsonify({
                "success": False,
                "message": password_error
            }), 400
        
        mongo = current_app.mongo
        
        # Update password
        update_data = {
            "password_hash": generate_password_hash(new_password),
            "updated_at": datetime.utcnow()
        }
        
        result = mongo.db.users.update_one(
            {"_id": ObjectId(user_id), "is_active": True},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({
                "success": False,
                "message": "Failed to reset password"
            }), 500
        
        return jsonify({
            "success": True,
            "message": "Password reset successfully"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Reset password error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500


@auth_bp.route("/validate-token", methods=["GET"])
@jwt_required()
def validate_token():
    """Validate JWT token"""
    try:
        user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        user = mongo.db.users.find_one({
            "_id": ObjectId(user_id),
            "is_active": True
        })
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 401
        
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user.get("name", user["username"])
        }
        
        return jsonify({
            "success": True,
            "user": user_data,
            "valid": True
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return jsonify({
            "success": False,
            "valid": False,
            "message": "Invalid token"
        }), 401


@auth_bp.route("/health", methods=["GET"])
def auth_health():
    """Auth service health check"""
    try:
        mongo = current_app.mongo
        # Test database connection
        mongo.db.command('ping')
        
        # Check users collection exists
        collections = mongo.db.list_collection_names()
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "service": "auth",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "collections": collections,
            "endpoints": [
                "/auth/register",
                "/auth/login",
                "/auth/logout",
                "/auth/me",
                "/auth/refresh",
                "/auth/forgot-password",
                "/auth/reset-password",
                "/auth/check-availability",
                "/auth/validate-token"
            ]
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "service": "auth",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 503


# Error handlers
@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Auth endpoint not found"
    }), 404


@auth_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "message": "Method not allowed for this endpoint"
    }), 405


@auth_bp.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500