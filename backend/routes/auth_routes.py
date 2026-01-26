from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.auth_service import register_user, login_user
from utils.auth import generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    mongo = current_app.mongo

    if register_user(mongo, data["username"], data["email"], data["password"]):
        return jsonify({"message": "User registered successfully"}), 201

    return jsonify({"error": "User already exists"}), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    mongo = current_app.mongo

    user_id = login_user(mongo, data["email"], data["password"])

    if not user_id:
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user_id)
    return jsonify({"access_token": token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT logout = frontend deletes token
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    return jsonify({"user_id": user_id}), 200
