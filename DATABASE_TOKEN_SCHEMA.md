# Database Schema Update - Token Storage

## Updated User Document Structure

Your MongoDB users collection now has these new fields for token storage:

```javascript
{
  // Existing fields
  _id: ObjectId("697c3e5e98092b1221758f1a"),
  email: "ckfamini.tshs@gmail.com",
  username: "ckfamini.tshs",
  name: "Tel",
  password_hash: "scrypt:32768:8:1$GysVSwJWUm9KMqWu$706d13ae8ec1ebe5af9335de2daaad063bf7…",
  created_at: ISODate("2026-01-30T05:15:10.674Z"),
  is_active: true,
  role: "user",
  avatar: null,
  last_login: ISODate("2026-01-30T06:13:25.413Z"),
  
  // NEW: Token fields
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Current access token
  refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Refresh token
  token_created_at: ISODate("2026-01-30T07:00:00.000Z"),     // When token was created
  token_expires_at: ISODate("2026-01-31T07:00:00.000Z")      // When token expires (24 hours)
}
```

## How It Works

### On Login:
1. User enters email and password
2. Backend verifies credentials
3. Backend generates JWT access token (24-hour expiration)
4. Backend generates JWT refresh token (30-day expiration)
5. **NEW:** Both tokens are stored in the database
6. Tokens are sent to frontend
7. Frontend stores tokens in device storage

### On Logout:
1. Frontend sends logout request with auth token
2. Backend verifies the token
3. **NEW:** Backend clears tokens from database:
   - Sets `access_token` to `null`
   - Sets `refresh_token` to `null`
   - Sets `token_expires_at` to `null`
4. Backend clears JWT cookies
5. Frontend clears device storage
6. Frontend redirects to login page

### On App Restart:
1. Frontend checks device storage for saved token
2. **NEW:** Frontend can also verify token is still valid in database
3. If token exists and is valid, user stays logged in
4. If token doesn't exist or is expired, user is logged out

## Benefits

✅ **Token History** - Can see when user last logged in/out
✅ **Session Management** - Can revoke tokens without waiting for expiration
✅ **Audit Trail** - Database record of all token lifecycle events
✅ **Multi-Device Logout** - Can invalidate all tokens for a user
✅ **Security** - Backend knows which tokens are active/revoked
✅ **Compliance** - Better logging for security audits

## Current Configuration

- **Port**: 8081 (only)
- **CORS Origins**: localhost:8081 and 127.0.0.1:8081
- **Access Token Expiration**: 24 hours
- **Refresh Token Expiration**: 30 days
- **Token Storage**: Device storage (AsyncStorage) + MongoDB database

## Testing

### After Login, Check Database:
```javascript
db.users.findOne({email: "ckfamini.tshs@gmail.com"})
// Should show:
// {
//   ...,
//   access_token: "eyJ...",
//   refresh_token: "eyJ...",
//   token_created_at: ISODate(...),
//   token_expires_at: ISODate(...)
// }
```

### After Logout, Check Database:
```javascript
db.users.findOne({email: "ckfamini.tshs@gmail.com"})
// Should show:
// {
//   ...,
//   access_token: null,
//   refresh_token: null,
//   token_expires_at: null
// }
```

## Files Modified
- `backend/app.py` - CORS now only allows port 8081
- `backend/routes/auth_routes.py`:
  - Register endpoint stores tokens in database
  - Login endpoint stores tokens in database
  - Logout endpoint clears tokens from database

## Future Enhancements

You can extend this further:

```javascript
// Add device tracking
{
  devices: [
    {
      device_id: "unique-id",
      device_name: "iPhone 12",
      device_type: "mobile",
      access_token: "...",
      token_expires_at: ISODate(...),
      last_used: ISODate(...),
      ip_address: "192.168.1.102"
    }
  ]
}

// Add login attempts
{
  login_history: [
    {
      timestamp: ISODate(...),
      ip_address: "192.168.1.102",
      success: true,
      device: "mobile"
    }
  ]
}
```
