#!/usr/bin/env python3
"""
Script to create an admin user or promote an existing user to admin.
Usage: python make_admin.py <email>
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from pymongo import MongoClient
from bson import ObjectId

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "mushroom_app"

def make_admin(email):
    """Promote a user to admin role"""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Find the user
    user = db.users.find_one({"email": email})
    
    if not user:
        print(f"❌ User with email '{email}' not found")
        return False
    
    # Update the user's role to admin
    result = db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print(f"✅ User '{email}' has been promoted to admin")
        return True
    else:
        print(f"⚠️ User '{email}' already has admin role")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    make_admin(email)
