from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

# Middleware to check if user is admin
def admin_required(f):
    def decorated_function(*args, **kwargs):
        from functools import wraps
        @wraps(f)
        def wrapper(*args, **kwargs):
            mongo = current_app.mongo
            user_id = get_jwt_identity()
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user or user.get("role") != "admin":
                return jsonify({"success": False, "message": "Admin access required"}), 403
            
            return f(*args, **kwargs)
        return wrapper
    return decorated_function


# --------------------
# GET ALL USERS
# --------------------
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    mongo = current_app.mongo
    user_id = get_jwt_identity()
    
    # Check if user is admin
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        users = list(mongo.db.users.find({"is_active": True}).sort("created_at", -1))
        
        users_data = []
        for u in users:
            users_data.append({
                "id": str(u["_id"]),
                "email": u["email"],
                "name": u["name"],
                "username": u["username"],
                "role": u.get("role", "user"),
                "created_at": u.get("created_at").isoformat() if u.get("created_at") else None,
                "is_active": u.get("is_active", True)
            })
        
        return jsonify({
            "success": True,
            "total": len(users_data),
            "users": users_data
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# GET USER BY ID
# --------------------
@admin_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    mongo = current_app.mongo
    admin_id = get_jwt_identity()
    
    # Check if requester is admin
    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if not admin or admin.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "username": user["username"],
                "role": user.get("role", "user"),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                "is_active": user.get("is_active", True)
            }
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# UPDATE USER ROLE
# --------------------
@admin_bp.route("/users/<user_id>/role", methods=["PUT"])
@jwt_required()
def update_user_role(user_id):
    mongo = current_app.mongo
    admin_id = get_jwt_identity()
    
    # Check if requester is admin
    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if not admin or admin.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        new_role = data.get("role", "").lower().strip()
        
        if new_role not in ["admin", "user"]:
            return jsonify({"success": False, "message": "Invalid role"}), 400
        
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": new_role}}
        )
        
        return jsonify({
            "success": True,
            "message": f"User role updated to {new_role}"
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# DEACTIVATE USER
# --------------------
@admin_bp.route("/users/<user_id>/deactivate", methods=["PUT"])
@jwt_required()
def deactivate_user(user_id):
    mongo = current_app.mongo
    admin_id = get_jwt_identity()
    
    # Check if requester is admin
    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if not admin or admin.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        if str(user["_id"]) == admin_id:
            return jsonify({"success": False, "message": "Cannot deactivate your own account"}), 400
        
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False}}
        )
        
        return jsonify({
            "success": True,
            "message": "User deactivated successfully"
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# ACTIVATE USER
# --------------------
@admin_bp.route("/users/<user_id>/activate", methods=["PUT"])
@jwt_required()
def activate_user(user_id):
    mongo = current_app.mongo
    admin_id = get_jwt_identity()
    
    # Check if requester is admin
    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if not admin or admin.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": True}}
        )
        
        return jsonify({
            "success": True,
            "message": "User activated successfully"
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------
# GET ANALYTICS
# --------------------
@admin_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    mongo = current_app.mongo
    admin_id = get_jwt_identity()
    
    # Check if user is admin
    user = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if not user or user.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required"}), 403
    
    try:
        # Get total users
        total_users = mongo.db.users.count_documents({"is_active": True})
        
        # Get active users (created in last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = mongo.db.users.count_documents({
            "is_active": True,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Get admins count
        admins_count = mongo.db.users.count_documents({
            "is_active": True,
            "role": "admin"
        })
        
        # Get inactive users
        inactive_users = mongo.db.users.count_documents({"is_active": False})
        
        return jsonify({
            "success": True,
            "analytics": {
                "total_users": total_users,
                "active_users_30d": active_users,
                "admin_count": admins_count,
                "inactive_users": inactive_users,
                "total_accounts": mongo.db.users.count_documents({})
            }
        }), 200
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
