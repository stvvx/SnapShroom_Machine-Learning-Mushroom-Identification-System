# Email Setup - Complete Implementation & Testing Guide

## ✅ Status: Email Sending is Now Active

Your email configuration has been tested and is working correctly with Mailtrap.

---

## Fixed Issues

### 1. ❌ Flask-Mail Not Installed
**Fixed:** Added `Flask-Mail==0.9.1` to requirements.txt and installed it

### 2. ❌ Incorrect Flask Extension Access
**Fixed:** Changed from `current_app.mail.send()` to `current_app.extensions.get('mail').send()`

### 3. ✅ Email Configuration
**Status:** All configuration properly set in `.env` and `app.py`

---

## How to Send Emails After Predictions

### Frontend Request Format (React Native Example)

```javascript
// Send prediction request WITH email
const sendPredictionWithEmail = async (imageBase64, userEmail, userName) => {
  try {
    const response = await fetch('http://YOUR_BACKEND_URL/toxicity/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,              // ⭐ Required for prediction
        user_email: userEmail,                   // ⭐ REQUIRED for email
        user_name: userName,                     // ⭐ REQUIRED for email
        location: 'Central Park, NY',           // Optional
        date: new Date().toISOString(),         // Optional
        user_context: {                          // Optional
          age: 30,
          allergies: []
        }
      }),
    });

    const data = await response.json();
    
    console.log('Prediction received:', data.risk_assessment);
    console.log('Email sent:', data.email_sent);  // ← Check this!
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### What Fields Are Required for Email?

| Field | Required | Type | Example |
|-------|----------|------|---------|
| `image_base64` | YES | String | `"data:image/jpeg;base64,..."` |
| `user_email` | **YES (for email)** | String | `"user@example.com"` |
| `user_name` | **YES (for email)** | String | `"John Doe"` |
| `location` | NO | String | `"Central Park"` |
| `date` | NO | String | `"2026-02-25"` |
| `user_context` | NO | Object | `{age: 30, allergies: []}` |

---

## Testing Email Functionality

### Test 1: Verify Backend is Running

```bash
# In your backend directory
python app.py
# Expected: "[OK] MongoDB connected" and server starts
```

### Test 2: Send Test Email via Python Script

```bash
# In backend directory
python test_email.py
```

Expected output:
```
✅ Email sent successfully!
📨 Check your Mailtrap inbox at: https://mailtrap.io
```

### Test 3: Send Prediction Request with Email

Use this curl command or Postman:

```bash
curl -X POST http://localhost:5000/toxicity/predict \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "user_email": "youremail@example.com",
    "user_name": "Your Name",
    "location": "Home",
    "date": "2026-02-25"
  }'
```

The response will include:

```json
{
  "email_sent": true,    // ← This should be TRUE
  "timestamp": "2026-02-25T10:30:00Z",
  "image_analysis": { ... },
  "risk_assessment": { ... },
  "recommendations": [ ... ],
  "safety_actions": [ ... ]
}
```

### Test 4: Check Mailtrap Inbox

1. Go to https://mailtrap.io
2. Log in with your account
3. Click **"Demo Inbox"**
4. You should see your test emails there

---

## Debugging: Why Email Might Not Send

### Check the Backend Logs

When you send a prediction, look for these debug messages:

```
DEBUG: User email from context: user@example.com  ← Should show email
DEBUG: User name from context: John Doe           ← Should show name
DEBUG: Attempting to send email to user@example.com
DEBUG: Email send result: True                    ← Should be True
```

### Common Issues & Solutions

#### Issue 1: `email_sent: false` in response

**Check 1:** Is `user_email` in the request?
```python
# Add to frontend
body: JSON.stringify({
  ...otherData,
  user_email: "user@example.com",  // ← ADD THIS
  user_name: "User Name"            // ← ADD THIS
})
```

**Check 2:** Backend logs show "No email provided"
```
Solution: Verify the request includes user_email and user_name fields
```

#### Issue 2: Email appears in Mailtrap but not to real user

This is **expected** because Mailtrap is a sandbox. You're using sandbox credentials:
- Username: `a1dd469610546c`
- Server: `sandbox.smtp.mailtrap.io`

**For Production:** You need real email credentials (Gmail, SendGrid, etc.)

#### Issue 3: Error "Mail extension not initialized"

If you see: `"Email sent": false, "email_error": "Mail extension not initialized"`

**Solution:**
1. Make sure Flask-Mail is installed: `pip install Flask-Mail`
2. Restart your backend: `python app.py`
3. Check that `.env` has these variables

#### Issue 4: Emails not appearing in Mailtrap

Try the test script:
```bash
python test_email.py
```

If that works but predictions don't send emails:
1. Check backend console for error messages
2. Verify `user_email` and `user_name` are in the request
3. Ensure the app context is available (it is during requests)

---

## Production Setup

### To Use Real Email (Gmail, SendGrid, etc.)

Edit your `.env` file:

#### Gmail Example:
```bash
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # Use app-specific password, not Gmail password
MAIL_USE_TLS=True
MAIL_USE_SSL=False
```

#### SendGrid Example:
```bash
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your-sendgrid-api-key
MAIL_USE_TLS=True
MAIL_USE_SSL=False
```

---

## Complete Email Flow Diagram

```
User takes photo
       ↓
Frontend sends POST /toxicity/predict
  ├─ image_base64 (required)
  ├─ user_email (required for email) ⭐
  └─ user_name (required for email) ⭐
       ↓
Backend processes image
  ├─ Species classification
  ├─ Toxicity detection
  ├─ Risk assessment
       ↓
Backend creates Response
  ├─ Analysis results
  ├─ Recommendations
  └─ Safety actions
       ↓
Backend sends email ⭐
  ├─ Check user_email exists
  ├─ Create HTML email
  ├─ Send via Mailtrap
  └─ Set email_sent = true/false
       ↓
Response sent to Frontend
  ├─ All analysis data
  └─ email_sent: true ✅
       ↓
User receives email (in Mailtrap inbox for testing)
       ↓
User receives email (real inbox for production)
```

---

## Files Modified

✅ `backend/requirements.txt` - Added Flask-Mail==0.9.1
✅ `backend/.env` - Mailtrap credentials  
✅ `backend/app.py` - Mail initialization
✅ `backend/services/email_service.py` - Fixed Flask-Mail extension access
✅ `backend/routes/toxicity_routes.py` - Added debug logging
✅ `backend/test_email.py` - Created test script

---

## Next Steps

1. **Restart Backend**: Kill and restart `python app.py`
2. **Test Email**: Run `python test_email.py`
3. **Check Mailtrap**: Login to https://mailtrap.io
4. **Send Prediction**: Make a request with `user_email` and `user_name`
5. **Verify Email**: Check response has `"email_sent": true`
6. **View Email**: Check Mailtrap inbox for the email

---

## Quick Reference Checklist

- [ ] Flask-Mail installed (`pip install Flask-Mail`)
- [ ] `.env` has mail configuration
- [ ] Backend running (`python app.py`)
- [ ] Frontend sends `user_email` in prediction request
- [ ] Frontend sends `user_name` in prediction request
- [ ] Backend response includes `"email_sent"` field
- [ ] Email appears in Mailtrap inbox

If all checkboxes are ✅, email sending is working! 🎉

