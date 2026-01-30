from flask import Blueprint, request, jsonify, current_app, make_response
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token,
    create_refresh_token
)
from datetime import datetime, timedelta
from bson import ObjectId
import re
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# --------------------
# Helpers
# --------------------
def validate_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None


def validate_password(password):
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    return True, ""


def generate_username(email):
    return email.split("@")[0]


# --------------------
# REGISTER
# --------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        mongo = current_app.mongo

        email = data.get("email", "").lower().strip()
        password = (data.get("password") or "").strip()
        confirm_password = (data.get("confirmPassword") or data.get("confirm_password") or "").strip()
        name = (data.get("name") or "").strip()

        if not email or not password or not name:
            return jsonify({"success": False, "message": "All fields are required"}), 400

        if not validate_email(email):
            return jsonify({"success": False, "message": "Invalid email format"}), 400

        valid, msg = validate_password(password)
        if not valid:
            return jsonify({"success": False, "message": msg}), 400

        if password != confirm_password:
            return jsonify({"success": False, "message": "Passwords do not match"}), 400

        if mongo.db.users.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already registered"}), 409

        username = generate_username(email)

        user = {
            "email": email,
            "username": username,
            "name": name,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow(),
            "is_active": True,
            "role": "user",
            "avatar": None,
            "access_token": None,
            "refresh_token": None,
            "token_created_at": None,
            "token_expires_at": None
        }

        result = mongo.db.users.insert_one(user)

        access_token = create_access_token(
            identity=str(result.inserted_id),
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(identity=str(result.inserted_id))

        # Store tokens in database immediately after creating user
        mongo.db.users.update_one(
            {"_id": result.inserted_id},
            {"$set": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_created_at": datetime.utcnow(),
                "token_expires_at": datetime.utcnow() + timedelta(hours=24)
            }}
        )

        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": str(result.inserted_id),
                "email": email,
                "name": name,
                "username": username
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201

    except Exception as e:
        current_app.logger.error(e)
        return jsonify({"success": False, "message": "Server error"}), 500


# --------------------
# LOGIN
# --------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        mongo = current_app.mongo

        email = data.get("email", "").lower().strip()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password required"}), 400

        user = mongo.db.users.find_one({"email": email, "is_active": True})
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        access_token = create_access_token(
            identity=str(user["_id"]),
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(identity=str(user["_id"]))

        # Store tokens in database
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_created_at": datetime.utcnow(),
                "token_expires_at": datetime.utcnow() + timedelta(hours=24)
            }}
        )

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "username": user["username"]
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200

    except Exception as e:
        current_app.logger.error(e)
        return jsonify({"success": False, "message": "Server error"}), 500


# --------------------
# REFRESH TOKEN (FIXED)
# --------------------
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(
        identity=user_id,
        expires_delta=timedelta(hours=24)
    )
    return jsonify({"success": True, "access_token": access_token}), 200


# --------------------
# --------------------
# LOGOUT
# --------------------
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    mongo = current_app.mongo
    user_id = get_jwt_identity()
    
    # Clear tokens from database
    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "access_token": None,
            "refresh_token": None,
            "token_expires_at": None
        }}
    )
    
    response = make_response(
        jsonify({"success": True, "message": "Logged out"}),
        200
    )
    # Clear JWT cookies
    response.delete_cookie('access_token_cookie', path='/')
    response.delete_cookie('refresh_token_cookie', path='/')
    return response


# --------------------
# GET CURRENT USER
# --------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    mongo = current_app.mongo
    user_id = get_jwt_identity()

    user = mongo.db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    return jsonify({
        "success": True,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "username": user["username"]
        }
    }), 200


# --------------------
# UPDATE PROFILE (Name)
# --------------------
@auth_bp.route("/update-name", methods=["PUT"])
@jwt_required()
def update_name():
    mongo = current_app.mongo
    user_id = get_jwt_identity()

    try:
        data = request.get_json()
        name = (data.get("name") or "").strip()

        if not name:
            return jsonify({"success": False, "message": "Name is required"}), 400

        user = mongo.db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"name": name}}
        )

        return jsonify({
            "success": True,
            "message": "Name updated successfully",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": name,
                "username": user["username"]
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# UPDATE PASSWORD
# --------------------
@auth_bp.route("/update-password", methods=["PUT"])
@jwt_required()
def update_password():
    mongo = current_app.mongo
    user_id = get_jwt_identity()

    try:
        data = request.get_json()
        old_password = (data.get("oldPassword") or data.get("old_password") or "").strip()
        new_password = (data.get("newPassword") or data.get("new_password") or "").strip()
        confirm_password = (data.get("confirmPassword") or data.get("confirm_password") or "").strip()

        if not old_password or not new_password or not confirm_password:
            return jsonify({"success": False, "message": "All fields are required"}), 400

        if new_password != confirm_password:
            return jsonify({"success": False, "message": "New passwords do not match"}), 400

        valid, msg = validate_password(new_password)
        if not valid:
            return jsonify({"success": False, "message": msg}), 400

        user = mongo.db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        if not check_password_hash(user["password_hash"], old_password):
            return jsonify({"success": False, "message": "Current password is incorrect"}), 401

        if old_password == new_password:
            return jsonify({"success": False, "message": "New password must be different from current password"}), 400

        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password_hash": generate_password_hash(new_password)}}
        )

        return jsonify({
            "success": True,
            "message": "Password updated successfully"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
