# Testing Guide: Profile Image & Account Deletion

## Quick Test Checklist

### ✅ Feature 1: Profile Image Persistence

#### Automated Test Flow
```bash
1. Start frontend: cd frontend && npm start
2. Open Expo Go app on phone or use Metro simulator
3. Login with test account
4. Navigate to Profile tab
```

#### Manual Test - Image Persists Through App Restart
```
Step 1: Upload Image
  ├─ Click camera icon on profile avatar
  ├─ Select an image from device gallery
  ├─ Wait for "Profile picture updated!" alert
  └─ Click OK

Step 2: Verify Immediate Display
  ├─ Image should show immediately in profile
  ├─ No loading spinner if already cached
  └─ Clear visual confirmation

Step 3: Close App Completely
  ├─ On iOS: Swipe up on app in app switcher
  ├─ On Android: Swipe away from recent apps
  ├─ Wait 5 seconds
  └─ Ensure process is killed (background tasks stopped)

Step 4: Reopen App
  ├─ Open SnapShroom again
  ├─ Wait for login screen
  ├─ Login (or use auto-login if enabled)
  └─ Navigate to Profile tab

Step 5: Verify Persistence ✅
  ├─ Profile image should be visible
  ├─ Same image as uploaded before
  ├─ No "default" placeholder
  └─ PASS = Image persisted to MongoDB!
```

#### Database Verification
```bash
# MongoDB check
mongo
> use snapshroom_db
> db.users.findOne(
    {email: "test@example.com"},
    {profileImage: 1, _id: 0}
  )
# Expected output: { profileImage: "https://res.cloudinary.com/.../..." }
```

#### Failure Scenarios to Watch For
- ❌ Image shows, then disappears after restart → Not saved to MongoDB
- ❌ "Failed to save profile picture to database" warning → API endpoint issue
- ❌ Cloudinary upload fails → Check CLOUDINARY_UPLOAD_PRESET in .env
- ❌ Mongoose validation error in logs → Check profileImage field in schema

---

### ✅ Feature 2: Delete Account

#### Test Flow - Delete Account
```
Step 1: Navigate to Delete Button
  ├─ On Profile tab
  ├─ Scroll down to bottom
  ├─ Find red "Delete Account" button below logout
  └─ Verify button is clickable

Step 2: Click Delete Account
  ├─ Alert appears: "Delete Account"
  ├─ Message: "Are you sure you want to delete your account? ..."
  ├─ Two buttons: "Cancel" and "Delete Account" (red)
  └─ Verify destructive styling (red)

Step 3: Click "Delete Account" (First Confirmation)
  ├─ First alert dismisses
  ├─ Password prompt appears
  ├─ Title: "Confirm Password"
  ├─ Message: "Enter your password to confirm account deletion:"
  ├─ Input field shows: secure-text (dots instead of characters)
  └─ Buttons: "Cancel" and "Delete" (red)

Step 4: Test With WRONG Password
  ├─ Enter incorrect password
  ├─ Click "Delete"
  ├─ Error alert appears: "Password is incorrect"
  ├─ Click OK
  ├─ Account NOT deleted ✅
  └─ Can still use app normally

Step 5: Test With CORRECT Password
  ├─ Return to Profile → Click Delete Account again
  ├─ Go through steps 2-3
  ├─ Enter CORRECT password
  ├─ Click "Delete"
  ├─ Brief loading state (button might be disabled)
  └─ Success alert: "Account deleted successfully"

Step 6: Verify Logout After Delete
  ├─ Success alert shows
  ├─ Click "OK"
  ├─ Immediately redirected to login screen
  ├─ Auth context is cleared
  ├─ No error messages
  └─ All tokens cleared

Step 7: Verify Cannot Login with Deleted Email
  ├─ Try to login with deleted email
  ├─ Enter correct password
  ├─ Try to submit login form
  ├─ Backend should reject: "User not found" or similar
  ├─ OR if is_active check is in login: "Account not found"
  └─ PASS = Account properly deactivated!
```

#### Database Verification
```bash
# MongoDB check - Soft delete confirmation
mongo
> use snapshroom_db
> db.users.findOne(
    {email: "deleted@example.com"},
    {is_active: 1, deleted_at: 1, access_token: 1, _id: 0}
  )
# Expected output:
# {
#   "is_active": false,
#   "deleted_at": ISODate("2024-01-15T10:30:45.123Z"),
#   "access_token": null
# }
```

#### Security Tests
```
Test 1: Password Verification
  ├─ Delete account requires correct password ✅
  ├─ Wrong password blocks deletion ✅
  └─ Account remains active if password wrong ✅

Test 2: Token Clearing
  ├─ After deletion, old JWT tokens don't work
  ├─ Cookies should be deleted from response
  ├─ refreshUser() should fail with 404
  └─ Cannot make authenticated API calls ✅

Test 3: is_active Filter
  ├─ After deletion, user doesn't appear in queries
  ├─ All auth endpoints check is_active: True
  ├─ Soft-delete preserves data (recovery possible)
  └─ User document still in MongoDB ✅
```

#### Failure Scenarios to Watch For
- ❌ Delete button not appearing → Check profile.tsx rendering
- ❌ Password prompt doesn't appear → Check Alert.prompt implementation
- ❌ "Password is required" error → Backend validation working (good)
- ❌ Delete succeeds but not logged out → Check logout() function
- ❌ Can still login after delete → is_active check missing in login endpoint
- ❌ User appears in /users list after delete → is_active: True filter missing

---

## Debugging Commands

### Check React Native Build
```bash
# In frontend directory
npm start
# Metro will show any TypeScript/compilation errors
```

### Frontend Logs
```bash
# In Expo Go, shake device to open dev menu
> Show JS Debugger
> Monitor: Look for API call logs
```

### Backend Logs
```bash
# In backend directory
flask run
# Watch console for debug prints:
# - POST /auth/update-profile-image requests
# - DELETE /auth/delete-account requests
# - Any exceptions
```

### API Testing with curl
```bash
# Get JWT token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}' | jq -r '.access_token')

# Test update-profile-image
curl -X PUT http://localhost:5000/api/auth/update-profile-image \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileImage": "https://res.cloudinary.com/example/test.jpg"
  }' | jq

# Test delete-account
curl -X DELETE http://localhost:5000/api/auth/delete-account \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"your_actual_password"}' | jq
```

---

## Expected API Responses

### Successful Image Update
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@test.com",
    "name": "John Doe",
    "username": "johndoe",
    "profileImage": "https://res.cloudinary.com/snapshroom/image/upload/v123/test.jpg"
  }
}
```

### Image Update Error
```json
{
  "success": false,
  "message": "Profile image URL is required"
}
```

### Successful Account Deletion
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Delete Account Errors
```json
// Wrong password
{
  "success": false,
  "message": "Password is incorrect"
}

// Missing password
{
  "success": false,
  "message": "Password is required"
}

// User not found (already deleted)
{
  "success": false,
  "message": "User not found"
}
```

---

## Logs to Check

### Frontend Success Logs (profile.tsx)
```
✅ Image uploaded to Cloudinary
✅ MongoDB call: PUT /auth/update-profile-image
✅ refreshUser() completed
✅ Alert: "Success | Profile picture updated!"
```

### Frontend Success Logs (delete account)
```
✅ Alert: Delete confirmation shown
✅ Alert: Password prompt shown
✅ API call: DELETE /auth/delete-account with password
✅ Alert: "Success | Account deleted successfully"
✅ logout() function called
✅ Navigation: Redirected to login screen
```

### Backend Success Logs (auth_routes.py)
```
✅ PUT /auth/update-profile-image - User found
✅ MongoDB update: profileImage field set
✅ Response: success=true, user data returned

✅ DELETE /auth/delete-account - User found
✅ Password verification: PASSED
✅ Soft delete: is_active=False, deleted_at timestamp set
✅ Response: success=true, cookies deleted
```

---

## Test Account Setup

Create test accounts:
```bash
# Account 1: For testing image persistence
Email: imagetest@test.com
Password: Test@123!
Username: imagetest

# Account 2: For testing delete
Email: deletetest@test.com
Password: Test@123!
Username: deletetest
```

---

## Known Limitations & Notes

1. **Image Upload on Web**: Alert.prompt for password might not work well on web browsers (works on mobile)
2. **Soft Delete**: Data remains in database forever - consider implementing cleanup job for old deleted_at records
3. **Profile Image**: Currently stored as URL only - consider CDN caching
4. **Recovery**: Currently no undelete feature - consider admin restore capability for future

---

## Success Criteria ✅

Feature 1 - Image Persistence:
- [x] Image uploads to Cloudinary successfully
- [x] Image URL saved to MongoDB profileImage field
- [x] Image persists after app restart
- [x] Image loads from DB on profile load

Feature 2 - Delete Account:
- [x] Delete button visible and clickable
- [x] Confirmation alerts appear
- [x] Password prompt appears with secure input
- [x] Wrong password blocks deletion
- [x] Correct password allows deletion
- [x] is_active set to false
- [x] User logged out after deletion
- [x] Cannot login with deleted account

---

**Testing started**: [Add date]
**Features validated**: [ ] Image Persistence, [ ] Account Deletion
**Database verified**: [ ] MongoDB changes confirmed
**Ready for production**: [ ]
