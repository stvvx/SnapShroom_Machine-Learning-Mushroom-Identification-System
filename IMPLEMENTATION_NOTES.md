# Important Implementation Notes

## Critical Configuration Points

### Backend Configuration

**File**: `backend/routes/auth_routes.py`

**Required Imports** (should already exist):
```python
from flask import Flask, Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from werkzeug.security import check_password_hash
from datetime import datetime
```

**MongoDB Collection**: `snapshroom_db.users`

**Fields Used**:
- `_id`: ObjectId (existing)
- `email`: string (existing)
- `password_hash`: string (existing)
- `is_active`: boolean (existing)
- `profileImage`: string (NEW - will be created on first update)
- `deleted_at`: datetime (NEW - only set on deletion)
- `access_token`: string or null (existing)
- `refresh_token`: string or null (existing)

**Endpoint Security**:
- Both endpoints require `@jwt_required()` decorator
- Both endpoints verify user is `is_active: True`
- Delete endpoint verifies password hash
- No CORS issues expected (same-origin requests)

---

### Frontend Configuration

**File**: `frontend/app/(tabs)/profile.tsx`

**Required Context**:
- `api` instance from `AuthContext` (axios configured with JWT headers)
- `refreshUser()` function from `AuthContext`
- `logout()` function from `AuthContext`
- `loading` state variable (exists)
- `setLoading()` setter

**Required Components**:
- `TouchableOpacity` from `react-native`
- `Alert` from `react-native`
- `Ionicons` from `@expo/vector-icons`
- `ThemedView`, `ThemedText` from theme context

**Required Cloudinary Configuration** (existing):
- `CLOUDINARY_API_URL`
- `CLOUDINARY_UPLOAD_PRESET`
- These should already be configured in constants

---

## Important Behaviors to Verify

### Image Upload Flow

**Current Working Flow**:
1. User clicks camera icon
2. ImagePicker opens
3. User selects image from gallery
4. Image converted to Blob
5. FormData created with image blob
6. Uploaded to Cloudinary with folder/tags
7. **NEW**: Extract `secure_url` from Cloudinary response
8. **NEW**: Call `/auth/update-profile-image` API with URL
9. **NEW**: Call `refreshUser()` to reload from database
10. **NEW**: Show success alert

**Expected Success Flow**:
- Cloudinary upload succeeds → "securely_url" extracted
- MongoDB save succeeds → No API errors
- refreshUser() reloads profile → profileImage field populated
- Alert shows "Profile picture updated!"

**Error Scenarios**:
- Cloudinary fails: "Failed to upload profile picture" alert
- MongoDB fails: "Warning: Failed to save to database" alert but Cloudinary still has image
- API network error: "Warning" alert with error message

### Account Deletion Flow

**Current Working Flow**:
1. User clicks "Delete Account" button
2. First alert confirms account deletion
3. User clicks "Delete Account" (destructive)
4. Password prompt appears (secure-text input)
5. User enters password
6. **NEW**: Call `/auth/delete-account` API with password
7. **NEW**: On success, show alert then call logout()
8. User redirected to login screen
9. Tokens cleared from AuthContext
10. Cannot login with that email anymore

**Expected Success Flow**:
- Delete alert shown → User confirms
- Password prompt appears → User enters password
- API call succeeds → Success alert shown
- logout() called → User redirected to login
- Login attempt fails → Backend rejects (is_active: false)

**Security Flow**:
- Wrong password → Error alert, account not deleted
- Correct password → Deletion proceeds
- Both require user interaction (no silent deletion)
- Password never logged (secure-text hides input)

---

## Database Changes Needed

**MongoDB Schema Update**:

The `users` collection will automatically get new fields when first accessed:

```javascript
// New fields added by endpoints:
db.users.updateOne(
  {_id: ObjectId("...")},
  {
    $set: {
      profileImage: "https://..."  // from update-profile-image endpoint
    }
  }
)

// OR when deleting:
db.users.updateOne(
  {_id: ObjectId("...")},
  {
    $set: {
      is_active: false,
      deleted_at: ISODate(...),
      access_token: null,
      refresh_token: null,
      token_expires_at: null
    }
  }
)
```

**No migration script needed** - MongoDB will auto-create fields.

---

## API Request/Response Details

### Request: Update Profile Image

```http
PUT /api/auth/update-profile-image HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v1234567890/profile.jpg"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v1234567890/profile.jpg"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Profile image URL is required"
}
```

---

### Request: Delete Account

```http
DELETE /api/auth/delete-account HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "password": "UserActualPassword123!"
}
```

**Response Success (200)**:
```http
HTTP/1.1 200 OK
Set-Cookie: access_token_cookie=; Max-Age=0; Path=/
Set-Cookie: refresh_token_cookie=; Max-Age=0; Path=/
Content-Type: application/json

{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Response Error (401 - Wrong Password)**:
```json
{
  "success": false,
  "message": "Password is incorrect"
}
```

---

## Frontend State Management

### Profile Component State
```tsx
const [profileImage, setProfileImage] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
// ... other state variables ...
```

### AuthContext State
```tsx
const [user, setUser] = useState<User | null>(null);  // Includes profileImage field
const [accessToken, setAccessToken] = useState<string | null>(null);
// ... other state ...
```

### State Flow on Image Update
1. User selects image
2. `setProfileImage(imageUrl)` - Updates local state (immediate display)
3. API call to backend
4. On success: `refreshUser()` - Reloads user from backend
5. User object updated with `profileImage` field
6. Profile re-renders with image from both local state and backend

### State Flow on Account Deletion
1. `setLoading(true)` - Disables button
2. API call to backend
3. On success: `logout()` is called
4. `logout()` clears AuthContext state
5. User redirected to login
6. All state cleared

---

## Error Handling Strategy

### Backend Error Handling
All endpoints wrap logic in try/catch:
```python
try:
    # Main logic
    return jsonify({"success": True, ...}), 200
except Exception as e:
    return jsonify({"success": False, "message": str(e)}), 500
```

### Frontend Error Handling
```tsx
try {
  const response = await api.put('/auth/update-profile-image', {...});
  if (response.data.success) {
    // Success
  }
} catch (error: any) {
  const message = error.response?.data?.message || 'Default error message';
  Alert.alert('Error', message);
}
```

### Error Messages Shown to Users
- "Profile image URL is required" - Missing URL
- "User not found" - User doesn't exist or already deleted
- "Password is required" - Missing password for delete
- "Password is incorrect" - Wrong password entered
- "Failed to delete account" - General error

---

## Performance Considerations

### Image Upload
- ImagePicker: ~1-2 seconds (user dependent)
- Cloudinary upload: ~2-5 seconds (network dependent)
- MongoDB update: ~100-500ms
- Total: ~3-8 seconds (mostly network)

### Account Deletion
- Password verification: ~50-100ms (hash comparison)
- MongoDB update: ~100-500ms
- Cookie deletion: ~10ms
- Total: ~150-610ms

### Caching
- User object cached in AuthContext
- Profile image also stored locally in component state
- `refreshUser()` re-fetches from backend to verify

---

## Browser/Platform Support

### Frontend
- **iOS**: Fully supported (Alert.prompt works)
- **Android**: Fully supported (Alert.prompt works)
- **Web**: Supported but Alert.prompt may not work well in some browsers
- **Expo Go**: Fully supported (testing)

### Backend
- Platform agnostic (pure Flask)
- Works with all modern HTTP clients
- No client-specific code

---

## Monitoring & Debugging

### Logs to Watch

**Frontend (Expo console)**:
```
[ProfileScreen] Uploading to Cloudinary...
[ProfileScreen] Image URL saved: https://res.cloudinary.com/...
[ProfileScreen] MongoDB update succeeded
[ProfileScreen] User profile refreshed
```

**Backend (Flask logs)**:
```
PUT /api/auth/update-profile-image - [JWT user_id]
User found, updating profileImage
DELETE /api/auth/delete-account - [JWT user_id]
Password verified, soft-deleting account
```

### Debug Endpoints (to add for testing)
```python
# Get current user profile
GET /api/auth/profile

# Check if email exists
GET /api/auth/check-email?email=test@test.com
```

---

## Future Enhancements

### Phase 2: Undelete Feature
- Add endpoint to restore deleted account (admin only)
- Send email to user: "Your account was deleted"

### Phase 2: Image Optimization
- Resize image before upload to Cloudinary
- Generate thumbnails
- Implement image versioning

### Phase 2: Data Cleanup
- Scheduled job to permanently delete records after 90 days
- Audit log for all deletions
- Email notification on account deletion

### Phase 3: Two-Factor Verification
- Require 2FA for account deletion
- Send confirmation email
- SMS verification option

---

## Testing Checklist

### Before Deployment
- [ ] Frontend starts without errors (`npm start`)
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console
- [ ] Backend API accessible
- [ ] MongoDB connection working

### Image Persistence Tests
- [ ] Upload image shows success alert
- [ ] Image displays in profile immediately
- [ ] App closed and reopened
- [ ] Image still visible (persisted)
- [ ] MongoDB document shows profileImage field

### Account Deletion Tests
- [ ] Delete button visible on profile
- [ ] Delete confirmation alert appears
- [ ] Password prompt appears
- [ ] Wrong password rejected with error
- [ ] Correct password allows deletion
- [ ] User logged out after deletion
- [ ] Cannot login with deleted email
- [ ] is_active: false verified in MongoDB

### Edge Cases
- [ ] Rapid image uploads (only latest saved)
- [ ] Large image uploads (>10MB)
- [ ] Network timeout during upload
- [ ] Delete while image uploading
- [ ] Delete with wrong password multiple times
- [ ] Try to delete already deleted account

---

## Rollback Plan

If issues arise:

1. **Image Persistence Issues**:
   - Remove the MongoDB save logic from uploadProfileImage()
   - Fallback to local state only
   - Revert changes to auth_routes.py

2. **Delete Account Issues**:
   - Hide delete button temporarily
   - Comment out handleDeleteAccount function
   - Remove DELETE endpoint from backend

3. **Database Issues**:
   - Don't drop profileImage field (just not used)
   - Users with is_active: false can be re-enabled: `db.users.updateOne({email: "..."}, {$set: {is_active: true}})`

---

## Version Information

**Implementation Version**: 1.0
**React Native**: Compatible with current version
**Flask**: 2.x+
**MongoDB**: 4.0+
**Node.js**: 16+

---

**Last Review**: January 2024
**Status**: Ready for Testing
**Owner**: Development Team
