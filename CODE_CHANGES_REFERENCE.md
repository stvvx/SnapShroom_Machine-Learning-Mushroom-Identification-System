# Code Changes Reference

## Backend Changes

### File: `backend/routes/auth_routes.py`

#### New Endpoint 1: Update Profile Image (PUT)
**Location**: Lines 331-373

```python
# --------------------
# UPDATE PROFILE IMAGE
# --------------------
@auth_bp.route("/update-profile-image", methods=["PUT"])
@jwt_required()
def update_profile_image():
    mongo = current_app.mongo
    user_id = get_jwt_identity()

    try:
        data = request.get_json()
        profile_image_url = (data.get("profileImage") or data.get("profile_image") or "").strip()

        if not profile_image_url:
            return jsonify({"success": False, "message": "Profile image URL is required"}), 400

        user = mongo.db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profileImage": profile_image_url}}
        )

        return jsonify({
            "success": True,
            "message": "Profile image updated successfully",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "username": user["username"],
                "profileImage": profile_image_url
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
```

#### New Endpoint 2: Delete Account (DELETE)
**Location**: Lines 375-419

```python
# --------------------
# DELETE ACCOUNT (Soft Delete)
# --------------------
@auth_bp.route("/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    mongo = current_app.mongo
    user_id = get_jwt_identity()

    try:
        data = request.get_json()
        password = (data.get("password") or "").strip()

        if not password:
            return jsonify({"success": False, "message": "Password is required"}), 400

        user = mongo.db.users.find_one({"_id": ObjectId(user_id), "is_active": True})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Verify password
        if not check_password_hash(user["password_hash"], password):
            return jsonify({"success": False, "message": "Password is incorrect"}), 401

        # Soft delete: set is_active to False
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "is_active": False,
                "deleted_at": datetime.utcnow(),
                "access_token": None,
                "refresh_token": None,
                "token_expires_at": None
            }}
        )

        response = make_response(
            jsonify({"success": True, "message": "Account deleted successfully"}),
            200
        )
        # Clear JWT cookies
        response.delete_cookie('access_token_cookie', path='/')
        response.delete_cookie('refresh_token_cookie', path='/')
        return response

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
```

---

## Frontend Changes

### File: `frontend/contexts/AuthContext.tsx`

#### Modified User Interface
**Location**: Lines 25-35

**Before**:
```tsx
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
}
```

**After**:
```tsx
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
  profileImage?: string;  // ← ADDED
}
```

---

### File: `frontend/app/(tabs)/profile.tsx`

#### Modified Function: uploadProfileImage()
**Location**: Lines 127-201

**Key Addition** (after Cloudinary upload):
```tsx
const cloudinaryData = await response.json();
const imageUrl = cloudinaryData.secure_url;
setProfileImage(imageUrl);

// ===== NEW CODE STARTS HERE =====
// Save image URL to MongoDB
try {
  const mongoResponse = await api.put('/auth/update-profile-image', {
    profileImage: imageUrl,
  });

  if (mongoResponse.data.success) {
    await refreshUser();
    Alert.alert('Success', 'Profile picture updated!');
  }
} catch (mongoError: any) {
  const message = mongoError.response?.data?.message || 'Failed to save profile picture to database';
  Alert.alert('Warning', message);
}
// ===== NEW CODE ENDS HERE =====
```

#### New Function: handleDeleteAccount()
**Location**: Lines 204-254

```tsx
const handleDeleteAccount = async () => {
  Alert.alert(
    'Delete Account',
    'Are you sure you want to delete your account? This action cannot be undone. Your profile will be deactivated permanently.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account',
        style: 'destructive',
        onPress: () => {
          // Show password confirmation dialog
          Alert.prompt(
            'Confirm Password',
            'Enter your password to confirm account deletion:',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async (password) => {
                  if (!password || !password.trim()) {
                    Alert.alert('Error', 'Password is required');
                    return;
                  }

                  setLoading(true);
                  try {
                    const response = await api.delete('/auth/delete-account', {
                      data: { password },
                    });

                    if (response.data.success) {
                      Alert.alert('Success', 'Account deleted successfully', [
                        {
                          text: 'OK',
                          onPress: async () => {
                            await logout();
                          },
                        },
                      ]);
                    }
                  } catch (error: any) {
                    const message = error.response?.data?.message || 'Failed to delete account';
                    Alert.alert('Error', message);
                  } finally {
                    setLoading(false);
                  }
                },
              },
            ],
            'secure-text'
          );
        },
      },
    ]
  );
};
```

#### New UI Element: Delete Account Button
**Location**: Lines 500-508

```tsx
{/* Logout and Delete Account Buttons */}
<View style={styles.section}>
  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Ionicons name="log-out" size={20} color="#D32F2F" />
    <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
  </TouchableOpacity>

  {/* ===== NEW BUTTON STARTS HERE ===== */}
  <TouchableOpacity
    style={[styles.logoutButton, styles.deleteButton]}
    onPress={handleDeleteAccount}
    disabled={loading}
  >
    <Ionicons name="trash" size={20} color="#D32F2F" />
    <ThemedText style={styles.logoutButtonText}>Delete Account</ThemedText>
  </TouchableOpacity>
  {/* ===== NEW BUTTON ENDS HERE ===== */}
</View>
```

#### New Style: deleteButton
**Location**: Line 729

```tsx
deleteButton: {
  marginTop: 12,
},
```

---

## MongoDB Schema Changes

### Updated `users` Collection Document

**Before** (profile image not stored):
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@test.com",
  "username": "testuser",
  "name": "Test User",
  "password_hash": "...",
  "is_active": true,
  "created_at": ISODate("2024-01-10T10:00:00Z"),
  "access_token": "...",
  "refresh_token": "..."
}
```

**After** (with new fields):
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@test.com",
  "username": "testuser",
  "name": "Test User",
  "password_hash": "...",
  "is_active": true,
  "created_at": ISODate("2024-01-10T10:00:00Z"),
  "access_token": "...",
  "refresh_token": "...",
  "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v123/test.jpg",  // NEW
  // OR after deletion:
  "is_active": false,  // CHANGED
  "deleted_at": ISODate("2024-01-15T10:30:45Z"),  // NEW
  "access_token": null,  // CHANGED
  "refresh_token": null  // CHANGED
}
```

---

## API Endpoints Summary

### Endpoint 1: Update Profile Image

**Endpoint**: `PUT /api/auth/update-profile-image`

**Headers Required**:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body**:
```json
{
  "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v123/test.jpg"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@test.com",
    "name": "Test User",
    "username": "testuser",
    "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v123/test.jpg"
  }
}
```

**Error Responses**:
- 400: `{ "success": false, "message": "Profile image URL is required" }`
- 404: `{ "success": false, "message": "User not found" }`
- 500: `{ "success": false, "message": "..." }`

---

### Endpoint 2: Delete Account

**Endpoint**: `DELETE /api/auth/delete-account`

**Headers Required**:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body**:
```json
{
  "password": "user's_actual_password"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**With Cookie Deletions**:
```
Set-Cookie: access_token_cookie=; Max-Age=0; Path=/
Set-Cookie: refresh_token_cookie=; Max-Age=0; Path=/
```

**Error Responses**:
- 400: `{ "success": false, "message": "Password is required" }`
- 401: `{ "success": false, "message": "Password is incorrect" }`
- 404: `{ "success": false, "message": "User not found" }`
- 500: `{ "success": false, "message": "..." }`

---

## Configuration Check

### Required Backend Imports
```python
from flask import Flask, Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from werkzeug.security import check_password_hash
from datetime import datetime
```

### Required Frontend Imports
```tsx
import { api } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
```

---

## Lines Changed Summary

| File | Change Type | Lines | Description |
|------|-------------|-------|-------------|
| auth_routes.py | ADD | 331-373 | New endpoint: update-profile-image |
| auth_routes.py | ADD | 375-419 | New endpoint: delete-account |
| profile.tsx | MODIFY | 127-201 | Enhanced uploadProfileImage() |
| profile.tsx | ADD | 204-254 | New function: handleDeleteAccount() |
| profile.tsx | ADD | 500-508 | New UI button: Delete Account |
| profile.tsx | ADD | 729 | New style: deleteButton |
| AuthContext.tsx | MODIFY | 31 | Added: profileImage field to User |

**Total Lines Added/Modified**: ~170 lines

---

## Git Diff Summary

If using version control:

```bash
# See all changes
git diff

# See changes by file
git diff backend/routes/auth_routes.py
git diff frontend/app/\(tabs\)/profile.tsx
git diff frontend/contexts/AuthContext.tsx

# Stage changes
git add .

# Commit with message
git commit -m "feat: add profile image persistence and account deletion

- Add PUT /auth/update-profile-image endpoint to save image URL to MongoDB
- Add DELETE /auth/delete-account endpoint with soft-delete (is_active: false)
- Modify uploadProfileImage() to persist Cloudinary URL to database
- Add handleDeleteAccount() with password confirmation flow
- Add Delete Account button to profile UI
- Update User interface with profileImage field"
```

---

## Verification Checklist

- [x] Backend endpoints created with proper JWT validation
- [x] Password verification implemented for account deletion
- [x] Frontend upload function calls new API after Cloudinary success
- [x] Frontend delete flow includes password confirmation
- [x] Delete button added to profile UI
- [x] Soft-delete pattern used (is_active: false, not hard delete)
- [x] Tokens cleared on account deletion
- [x] Cookies deleted in response
- [x] Error handling in all try/catch blocks
- [x] User interface updated with profileImage field
- [x] Styling matches existing design (red buttons)
- [x] All imports present in files
