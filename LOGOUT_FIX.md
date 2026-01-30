# Logout Fix - SnapShroom

## Problem
Users couldn't properly logout and login to a different account. After clicking logout, the user state wasn't being cleared before navigation, causing issues when trying to login as another user.

## Root Causes
1. **Logout wasn't calling the backend endpoint** - The local `clearAuth()` was called but the backend logout endpoint wasn't being invoked
2. **Race condition in state updates** - The redirect happened immediately (with setTimeout(0)) without waiting for React state to properly update
3. **Wrong redirect destination** - After logout, the app was redirecting to `/(auth)/login` instead of the landing page `/`, which could cause navigation confusion

## Solutions Implemented

### 1. **Enhanced Logout Function** (`frontend/contexts/AuthContext.tsx`)
```tsx
const logout = async () => {
  try {
    // Call backend logout endpoint if token exists
    if (accessToken) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        // Continue with local logout even if backend fails
        console.warn('Backend logout failed, clearing local auth', err);
      }
    }
  } finally {
    // Always clear local auth regardless of backend response
    await clearAuth();
  }
};
```

**Changes:**
- Now calls the backend `/auth/logout` endpoint to invalidate the session
- Gracefully handles backend failures while still clearing local auth
- Always ensures local state is cleaned up regardless of backend response

### 2. **Fixed Navigation Timing** (`frontend/app/(tabs)/index.tsx`)
```tsx
const performLogout = async () => {
  try {
    await logout();
    // Give React time to update context state before redirecting
    setTimeout(() => router.replace('/'), 100);
  } catch (error) {
    console.error('Error logging out:', error);
    // Even on error, clear user and redirect to landing page
    setTimeout(() => router.replace('/'), 100);
  }
};
```

**Changes:**
- Changed from `.then()/.catch()` pattern to `async/await` for better readability
- Increased timeout from 0ms to 100ms to ensure React state updates propagate
- Redirects to `/` (landing page) instead of `/(auth)/login`
- Ensures redirect happens even if logout fails

### 3. **Correct Navigation Flow**
- **Before logout:** User is on `/(tabs)/index` (home page)
- **After logout:** Redirects to `/` (landing/signup page)
- **Landing page logic:** Automatically redirects to `/(auth)` if user tries to access without logging in
- **Login page:** User can login with new credentials

## Testing Steps

1. **Start the backend:**
   ```bash
   cd backend
   python app.py
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test logout flow:**
   - Login with User A (email: user@example.com)
   - Click the "Logout" button in the top navigation
   - Confirm logout
   - Verify you're back at the landing/signup page
   - Click "Sign Up" or go to Login tab
   - Login with User B (different email)
   - Verify User B's data is displayed (name, email, etc.)
   - Verify no User A data is present

4. **Test error handling:**
   - If backend is down, logout should still clear local state and redirect properly

## Files Modified
- `frontend/contexts/AuthContext.tsx` - Enhanced logout function
- `frontend/app/(tabs)/index.tsx` - Fixed performLogout and navigation

## Additional Notes
- The deprecated warnings about "shadow*" and "pointerEvents" styles are from react-native-web and are not related to the logout issue
- These warnings can be addressed separately by updating component styles (using `boxShadow` instead of `shadowColor`, etc.)
- The logout fix ensures proper session termination and prevents auth state leakage between users
