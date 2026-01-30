from flask import Blueprint, request, jsonify, current_app
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
        password = data.get("password", "")
        confirm_password = data.get("confirmPassword", "")
        name = data.get("name", "").strip()

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
            "avatar": None
        }

        result = mongo.db.users.insert_one(user)

        access_token = create_access_token(
            identity=str(result.inserted_id),
            expires_delta=timedelta(hours=24)
        )
        refresh_token = create_refresh_token(identity=str(result.inserted_id))

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
# LOGOUT
# --------------------
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"success": True, "message": "Logged out"}), 200


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
