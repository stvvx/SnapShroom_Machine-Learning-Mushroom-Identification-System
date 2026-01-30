# Persistent Authentication Implementation

## Overview
Changed the authentication system to use persistent tokens and cookies. Users will now stay logged in even after system restart, unless they explicitly logout.

## Changes Made

### Frontend (`frontend/contexts/AuthContext.tsx`)

#### Before (Session Lost on Restart)
```tsx
useEffect(() => {
  setIsLoading(false);
}, []);
// Every app restart = logged out (landing page)
```

#### After (Persistent Session)
```tsx
useEffect(() => {
  const restoreAuth = async () => {
    try {
      // 1. Check if token and user data exist in AsyncStorage
      const [storedToken, storedUserJson] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
      ]);

      if (storedToken[1] && storedUserJson[1]) {
        const token = storedToken[1];
        const userData = JSON.parse(storedUserJson[1]);

        // 2. Restore axios headers with the stored token
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        // 3. Validate token is still valid by calling /auth/me
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            // Token valid → restore session
            setAccessToken(token);
            setUser(userData);
            setError(null);
          } else {
            // Token invalid → clear everything
            await clearAuth();
          }
        } catch (err) {
          // Token validation failed → clear everything
          console.warn('Token validation failed, clearing auth', err);
          await clearAuth();
        }
      }
    } catch (err) {
      console.error('Error restoring auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  restoreAuth();
}, []);
```

### How It Works

1. **On App Startup:**
   - Check AsyncStorage for stored token and user data
   - If found, restore axios headers with the token
   - Validate the token by calling `/auth/me` endpoint
   - If valid, show logged-in state; if invalid, show login page

2. **On Login:**
   - Store token and user in AsyncStorage (already implemented)
   - Set axios Authorization header
   - Restore user context state

3. **On Logout:**
   - Clear AsyncStorage
   - Remove axios Authorization header
   - Clear user/token from state
   - Backend deletes JWT cookies
   - Redirect to login page

4. **On System Restart:**
   - App loads → restoreAuth() runs automatically
   - If valid token exists → user stays logged in ✅
   - If no token or token expired → show login page ✅

## Storage Keys
- `STORAGE_KEYS.TOKEN` = `'snapshroom_access_token'`
- `STORAGE_KEYS.USER` = `'snapshroom_user'`

These are stored in AsyncStorage (persistent local storage on the device).

## Token Validation

The `/auth/me` endpoint is called during restore to verify the token is still valid:
```python
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    # Returns current user data if token is valid
```

If the token has expired (24-hour expiration), this endpoint will return 401, and the app will clear the stored session.

## Test Scenarios

### Test 1: Persistent Login
1. Login with valid credentials
2. Close and restart the app
3. **Expected:** User should be logged in automatically
4. **Expected:** User profile should be displayed

### Test 2: Logout
1. Login with valid credentials
2. Click Logout button
3. Confirm logout
4. **Expected:** Redirected to login page
5. Close and restart the app
6. **Expected:** Should see login page (user is logged out)

### Test 3: Token Expiration
1. Login with valid credentials
2. Wait 24 hours (or manually expire token in database)
3. Try to use the app
4. **Expected:** Token validation fails, user is logged out automatically

### Test 4: Multiple Users
1. Login as User A → stay logged in
2. Logout → see login page
3. Login as User B → User B stays logged in after restart
4. Confirm no User A data is present

## Backend Support

The backend already supports:
- ✅ JWT token generation on login/register
- ✅ Token validation via `/auth/me` endpoint
- ✅ Token cookie clearing on logout (newly implemented)
- ✅ JWT expiration (24 hours)

## Security Considerations

1. **Tokens are stored in AsyncStorage** - This is the standard for React Native apps. More secure than localStorage for web.
2. **Tokens are verified on app startup** - Backend validates that the token is still valid.
3. **Tokens expire after 24 hours** - Even if stolen, tokens become invalid after 24 hours.
4. **Logout properly clears everything** - Both server-side (cookies) and client-side (storage + state).
5. **No plaintext passwords stored** - Only JWT tokens and user metadata.

## Files Modified
- `frontend/contexts/AuthContext.tsx` - Implemented persistent authentication with token restoration

## Benefits
✅ Better user experience - Stay logged in across app restarts
✅ Secure - Token is validated on every app startup
✅ Flexible - Users can logout to completely clear session
✅ Scalable - Works with refresh tokens (30-day expiration)
