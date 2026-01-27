from bson.objectid import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import re
from typing import Optional, Dict, Any

class UserModel:
    """User model for MongoDB operations"""
    
    @staticmethod
    def get_user_by_email(mongo, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email
        
        Args:
            mongo: MongoDB connection
            email: User email
            
        Returns:
            User document or None
        """
        try:
            email = email.strip().lower()
            user = mongo.db.users.find_one({"email": email})
            
            if user:
                # Convert ObjectId to string for easier use
                user['id'] = str(user['_id'])
                # Remove sensitive data before returning
                if 'password_hash' in user:
                    del user['password_hash']
            
            return user
        except Exception as e:
            print(f"Error getting user by email {email}: {str(e)}")
            return None

    @staticmethod
    def get_user_by_username(mongo, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user by username
        
        Args:
            mongo: MongoDB connection
            username: Username
            
        Returns:
            User document or None
        """
        try:
            username = username.strip()
            user = mongo.db.users.find_one({"username": username})
            
            if user:
                user['id'] = str(user['_id'])
                if 'password_hash' in user:
                    del user['password_hash']
            
            return user
        except Exception as e:
            print(f"Error getting user by username {username}: {str(e)}")
            return None

    @staticmethod
    def get_user_by_id(mongo, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID
        
        Args:
            mongo: MongoDB connection
            user_id: User ID string or ObjectId
            
        Returns:
            User document or None
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            user = mongo.db.users.find_one({"_id": user_id})
            
            if user:
                user['id'] = str(user['_id'])
                if 'password_hash' in user:
                    del user['password_hash']
            
            return user
        except Exception as e:
            print(f"Error getting user by ID {user_id}: {str(e)}")
            return None

    @staticmethod
    def create_user(mongo, user_data: Dict[str, Any]) -> Optional[ObjectId]:
        """
        Create a new user
        
        Args:
            mongo: MongoDB connection
            user_data: User data dictionary
            
        Returns:
            Inserted user ID or None
        """
        try:
            # Required fields validation
            required_fields = ['username', 'email', 'password']
            for field in required_fields:
                if field not in user_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Clean and validate data
            user_data['username'] = user_data['username'].strip()
            user_data['email'] = user_data['email'].strip().lower()
            
            # Check if user already exists
            existing_user = UserModel.find_user_by_username_or_email(
                mongo, user_data['username'], user_data['email']
            )
            
            if existing_user:
                if existing_user['email'] == user_data['email']:
                    raise ValueError("Email already registered")
                else:
                    raise ValueError("Username already taken")
            
            # Prepare user document
            user_doc = {
                "username": user_data['username'],
                "email": user_data['email'],
                "password_hash": generate_password_hash(user_data['password']),
                "name": user_data.get('name', user_data['username']),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True,
                "is_verified": False,
                "avatar": user_data.get('avatar'),
                "bio": user_data.get('bio', ''),
                "subscription": user_data.get('subscription', {
                    "type": "free",
                    "start_date": datetime.utcnow(),
                    "expires_at": None
                }),
                "preferences": user_data.get('preferences', {
                    "notifications": True,
                    "email_updates": True,
                    "theme": "light",
                    "language": "en"
                }),
                "stats": {
                    "identifications": 0,
                    "correct_identifications": 0,
                    "favorites": 0,
                    "badges": []
                },
                "last_login": None
            }
            
            # Insert into database
            result = mongo.db.users.insert_one(user_doc)
            
            # Log the creation
            print(f"User created: {result.inserted_id} ({user_data['email']})")
            
            return result.inserted_id
            
        except ValueError as e:
            print(f"Validation error creating user: {str(e)}")
            return None
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return None

    @staticmethod
    def find_user_by_username_or_email(mongo, username: str, email: str) -> Optional[Dict[str, Any]]:
        """
        Find user by username or email
        
        Args:
            mongo: MongoDB connection
            username: Username to check
            email: Email to check
            
        Returns:
            User document or None
        """
        try:
            return mongo.db.users.find_one({
                "$or": [
                    {"username": username.strip()},
                    {"email": email.strip().lower()}
                ]
            })
        except Exception as e:
            print(f"Error finding user: {str(e)}")
            return None

    @staticmethod
    def authenticate_user(mongo, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with email and password
        
        Args:
            mongo: MongoDB connection
            email: User email
            password: User password
            
        Returns:
            User document (without password) or None
        """
        try:
            email = email.strip().lower()
            user = mongo.db.users.find_one({"email": email})
            
            if user and check_password_hash(user['password_hash'], password):
                # Update last login
                mongo.db.users.update_one(
                    {"_id": user['_id']},
                    {"$set": {"last_login": datetime.utcnow()}}
                )
                
                # Prepare safe user data
                safe_user = {
                    "id": str(user['_id']),
                    "username": user['username'],
                    "email": user['email'],
                    "name": user.get('name', user['username']),
                    "avatar": user.get('avatar'),
                    "created_at": user.get('created_at'),
                    "is_verified": user.get('is_verified', False),
                    "subscription": user.get('subscription', {"type": "free"}),
                    "preferences": user.get('preferences', {}),
                    "stats": user.get('stats', {}),
                    "bio": user.get('bio', ''),
                    "last_login": datetime.utcnow()
                }
                
                return safe_user
            return None
        except Exception as e:
            print(f"Error authenticating user {email}: {str(e)}")
            return None

    @staticmethod
    def update_user(mongo, user_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update user data
        
        Args:
            mongo: MongoDB connection
            user_id: User ID
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Remove fields that shouldn't be updated directly
            protected_fields = ['_id', 'id', 'password_hash', 'created_at']
            for field in protected_fields:
                update_data.pop(field, None)
            
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            # Special handling for password update
            if 'password' in update_data:
                update_data['password_hash'] = generate_password_hash(update_data['password'])
                del update_data['password']
            
            result = mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error updating user {user_id}: {str(e)}")
            return False

    @staticmethod
    def delete_user(mongo, user_id: str) -> bool:
        """
        Delete user (soft delete by setting is_active=False)
        
        Args:
            mongo: MongoDB connection
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "is_active": False,
                    "deleted_at": datetime.utcnow(),
                    "email": f"deleted_{user_id}@snapshroom.com",  # Anonymize email
                    "username": f"deleted_user_{user_id}"  # Anonymize username
                }}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error deleting user {user_id}: {str(e)}")
            return False

    @staticmethod
    def verify_email(mongo, user_id: str) -> bool:
        """
        Mark user email as verified
        
        Args:
            mongo: MongoDB connection
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "is_verified": True,
                    "email_verified_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error verifying email for user {user_id}: {str(e)}")
            return False

    @staticmethod
    def update_user_stats(mongo, user_id: str, stats_update: Dict[str, Any]) -> bool:
        """
        Update user statistics
        
        Args:
            mongo: MongoDB connection
            user_id: User ID
            stats_update: Statistics to update (e.g., {"identifications": 1})
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Build update operations
            update_ops = {}
            for key, value in stats_update.items():
                if isinstance(value, (int, float)):
                    update_ops[f"stats.{key}"] = {"$inc": value}
                else:
                    if key == "badges":
                        update_ops[f"stats.{key}"] = {"$addToSet": {"badges": value}}
                    else:
                        update_ops[f"stats.{key}"] = value
            
            result = mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": {"updated_at": datetime.utcnow()}, **update_ops}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error updating stats for user {user_id}: {str(e)}")
            return False

    @staticmethod
    def get_all_users(mongo, limit: int = 100, skip: int = 0) -> list:
        """
        Get all users with pagination
        
        Args:
            mongo: MongoDB connection
            limit: Maximum number of users to return
            skip: Number of users to skip
            
        Returns:
            List of user documents
        """
        try:
            users = mongo.db.users.find(
                {"is_active": True},
                {"password_hash": 0}
            ).skip(skip).limit(limit)
            
            user_list = []
            for user in users:
                user['id'] = str(user['_id'])
                user_list.append(user)
            
            return user_list
        except Exception as e:
            print(f"Error getting users: {str(e)}")
            return []

    @staticmethod
    def search_users(mongo, query: str, limit: int = 50) -> list:
        """
        Search users by username or name
        
        Args:
            mongo: MongoDB connection
            query: Search query
            limit: Maximum results
            
        Returns:
            List of matching users
        """
        try:
            users = mongo.db.users.find(
                {
                    "$and": [
                        {"is_active": True},
                        {"$or": [
                            {"username": {"$regex": query, "$options": "i"}},
                            {"name": {"$regex": query, "$options": "i"}},
                            {"email": {"$regex": query, "$options": "i"}}
                        ]}
                    ]
                },
                {"password_hash": 0}
            ).limit(limit)
            
            user_list = []
            for user in users:
                user['id'] = str(user['_id'])
                user_list.append(user)
            
            return user_list
        except Exception as e:
            print(f"Error searching users: {str(e)}")
            return []

    @staticmethod
    def get_user_count(mongo) -> int:
        """
        Get total number of active users
        
        Args:
            mongo: MongoDB connection
            
        Returns:
            Number of users
        """
        try:
            return mongo.db.users.count_documents({"is_active": True})
        except Exception as e:
            print(f"Error getting user count: {str(e)}")
            return 0

    @staticmethod
    def change_password(mongo, user_id: str, old_password: str, new_password: str) -> bool:
        """
        Change user password
        
        Args:
            mongo: MongoDB connection
            user_id: User ID
            old_password: Current password
            new_password: New password
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            user = mongo.db.users.find_one({"_id": user_id})
            
            if not user or not check_password_hash(user['password_hash'], old_password):
                return False
            
            result = mongo.db.users.update_one(
                {"_id": user_id},
                {"$set": {
                    "password_hash": generate_password_hash(new_password),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error changing password for user {user_id}: {str(e)}")
            return False

# For backward compatibility
get_user_by_email = UserModel.get_user_by_email
create_user = UserModel.create_user
get_user_by_id = UserModel.get_user_by_id