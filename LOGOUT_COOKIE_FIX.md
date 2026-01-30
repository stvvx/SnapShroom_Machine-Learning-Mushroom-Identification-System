# Complete Logout & Cookie Fix - SnapShroom

## Root Cause
The app was storing JWT tokens in **cookies** (configured in `config.py: JWT_TOKEN_LOCATION = ['headers', 'cookies']`), but the logout endpoint was **NOT clearing these cookies**. This caused the old user's JWT cookie to persist, preventing the new user from logging in properly.

## The Problem Flow
1. User A logs in → Backend sets JWT in cookie (access_token_cookie)
2. User A clicks logout → Frontend clears Authorization header and auth state
3. **Bug:** Backend logout didn't clear the cookie, so it persists in the browser
4. User B tries to login → Browser sends old User A's cookie with the request
5. Backend receives both User B's new token AND User A's old cookie
6. JWT validation gets confused or old token takes precedence

## Solutions Implemented

### 1. **Backend Logout - Clear JWT Cookies** (`backend/routes/auth_routes.py`)

**Added import:**
```python
from flask import Blueprint, request, jsonify, current_app, make_response
```

**Updated logout endpoint:**
```python
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(
        jsonify({"success": True, "message": "Logged out"}),
        200
    )
    # Clear JWT cookies
    response.delete_cookie('access_token_cookie', path='/')
    response.delete_cookie('refresh_token_cookie', path='/')
    return response
```

**What this does:**
- Properly deletes both access and refresh token cookies
- Sends `Set-Cookie` headers with `Max-Age=0` to clear browser cookies
- Ensures old authentication is completely removed from the browser

### 2. **Frontend - Ensure Clean State on Login** (`frontend/contexts/AuthContext.tsx`)

**Updated login function:**
```tsx
const login = async ({ email, password }: LoginCredentials) => {
  setIsLoading(true);
  setError(null);

  try {
    // Ensure clean state before login - remove any old authorization headers
    delete api.defaults.headers.common.Authorization;
    
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    // ... rest of login logic
```

**What this does:**
- Removes any old Authorization header before attempting new login
- Prevents old auth headers from interfering with new login request

### 3. **Frontend - Immediate State Clearing** (`frontend/contexts/AuthContext.tsx`)

**Updated clearAuth function:**
```tsx
const clearAuth = async () => {
  // Clear state immediately to prevent race conditions
  setUser(null);
  setAccessToken(null);
  delete api.defaults.headers.common.Authorization;
  
  // Then clear storage asynchronously
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.USER,
  ]);
};
```

**What this does:**
- Clears React state immediately (synchronous) to prevent race conditions
- Clears AsyncStorage in the background
- Removes Authorization header before async operations complete
- Ensures UI updates immediately reflect logged-out state

## Why This Works

**Before (Broken):**
```
User A Login → Token in Cookie → User A Logout → Cookie NOT Deleted
User B Login → Browser sends old Cookie + new Token → Conflict!
```

**After (Fixed):**
```
User A Login → Token in Cookie → User A Logout → Cookie DELETED + State Cleared
User B Login → No old Cookie → Only new Token sent → ✅ Works!
```

## Testing Steps

### Test 1: Basic Logout and Re-login
1. Start backend: `python app.py`
2. Start frontend: `npm start`
3. **Login as User A:**
   - Email: `ckfamini.tshs@gmail.com`
   - Password: Your password
4. **Logout:**
   - Click "Logout" button
   - Confirm in dialog
   - Verify redirected to landing page
5. **Login as User B:**
   - Email: Different email address
   - Password: Correct password
   - **Verify:** User B's profile displays (different name, email, username)

### Test 2: Multiple Sequential Logins
1. Login → Logout → Login → Logout → Login
2. Each user should display their correct data
3. No data leakage between users

### Test 3: Browser Developer Tools
1. Open DevTools → Application → Cookies
2. After logging in: Should see `access_token_cookie` and `refresh_token_cookie`
3. After logging out: Both cookies should be gone
4. After logging in as new user: New cookies should appear

## Files Modified
- `backend/routes/auth_routes.py` - Added cookie clearing to logout endpoint
- `frontend/contexts/AuthContext.tsx` - Improved logout and login state management

## Configuration Context
- Backend JWT is configured in `backend/config.py`
- JWT stored in both headers AND cookies: `JWT_TOKEN_LOCATION = ['headers', 'cookies']`
- Access token expires in 24 hours
- Refresh token expires in 30 days

## Additional Notes
- Database structure looks correct (as shown in your screenshot)
- The issue was purely in authentication flow, not data
- This fix maintains security by properly invalidating old sessions
