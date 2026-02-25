# Email Sending Troubleshooting Checklist

## ✅ What Was Fixed

1. **Frontend API Interface** - Added `user_email` and `user_name` fields to `MushroomAnalysisRequest`
2. **AuthContext Integration** - Now imports AuthContext to get logged-in user data
3. **Prediction Screen** - Passes user email and name to backend when analyzing
4. **Debug Logging** - Added console logs to track email sending

---

## 📋 Step-by-Step Testing Guide

### Step 1: Check Backend is Running

Open a terminal and run:

```bash
cd backend
python app.py
```

Expected output:
```
[OK] MongoDB connected
[OK] Folder uploads ready
[OK] Folder models ready
[OK] Folder datasets ready
[OK] Folder logs ready
 * Running on http://0.0.0.0:5000
```

### Step 2: Test Email Configuration Directly

```bash
python test_email.py
```

**Expected:**
```
✅ Email sent successfully!
```

### Step 3: Verify Frontend Has User Data

In React Native (Expo), check device console when predicting:

Look for these logs:
```
📧 User Email: user@example.com      ← Should not be undefined
👤 User Name: John Doe               ← Should not be undefined
```

If you see `undefined` for either:
- ✗ User is NOT logged in
- ✗ AuthContext not properly imported
- ✗ User object missing email/name fields

### Step 4: Verify Data Sent to Backend

In Expo console, look for:
```
📡 POST http://YOUR_BACKEND_URL/toxicity/predict
📦 Payload size: 12345 bytes
```

The payload should include user_email and user_name fields.

### Step 5: Check Backend Receives Email Data

Backend console should show:
```
DEBUG: User email from context: user@example.com
DEBUG: User name from context: John Doe
DEBUG: Full context data: {'image_base64': '...', 'user_email': 'user@example.com', ...}
```

If you see:
```
DEBUG: No email in context. Context keys: ['image_base64', 'location', ...]
```

Then the email fields are NOT being sent from frontend.

### Step 6: Check Email Actually Sends

Backend console should show:
```
DEBUG: Attempting to send email to user@example.com
DEBUG: Email send result: True
```

### Step 7: Verify Response Includes Email Status

Response from backend should contain:
```json
{
  "email_sent": true,
  "timestamp": "2026-02-25T...",
  "image_analysis": { ... }
}
```

In Expo console:
```
📧 Email Status: ✅ SENT
```

---

## 🔍 Detailed Issue Diagnosis

### Issue: "User Email: undefined"

**Possible Causes:**
1. User not logged in
2. AuthContext not imported
3. User object missing email field
4. useContext hook not called

**Solution:**
```tsx
// ✅ Make sure prediction.tsx has:
import { AuthContext } from '@/contexts/AuthContext';
const { user } = useContext(AuthContext);

console.log('User:', user);  // Should not be null
console.log('Email:', user?.email);  // Should be a string
```

### Issue: "Email send result: False"

**Possible Causes:**
1. Mailtrap credentials invalid
2. Mail extension not initialized
3. No user email provided
4. Flask-Mail not installed

**Solution:**
```bash
# Verify Flask-Mail is installed
pip show Flask-Mail

# Verify .env has credentials
echo $MAIL_SERVER
echo $MAIL_PORT
echo $MAIL_USERNAME

# Test sending directly
python test_email.py
```

### Issue: "email_sent: False, email_error: 'Mail extension not initialized'"

**Solution:**
1. Restart backend: `Ctrl+C` then `python app.py`
2. Verify `mail.init_app(app)` is in app.py (line ~116)
3. Install Flask-Mail: `pip install Flask-Mail`

### Issue: Email sent but not appearing in Mailtrap

**Check:**
1. Go to https://mailtrap.io
2. Login to your account
3. Click "Demo Inbox"
4. Should see recently sent emails

If no email appears:
- Email address in request might be empty
- Mailtrap credentials might be wrong
- Email service is failing silently

**Debug:** Add exception handling and logs

---

## 🛠️ Complete Email Flow Debug

Create this file: `backend/debug_email.py`

```python
#!/usr/bin/env python
"""
Complete email debugging script
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("SNAPSHROOM EMAIL DEBUG")
print("=" * 60)

print("\n1. CHECK ENVIRONMENT VARIABLES")
print("-" * 60)
print(f"MAIL_SERVER: {os.getenv('MAIL_SERVER')}")
print(f"MAIL_PORT: {os.getenv('MAIL_PORT')}")
print(f"MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
print(f"MAIL_PASSWORD: {'*' * len(os.getenv('MAIL_PASSWORD', ''))}")
print(f"MAIL_USE_TLS: {os.getenv('MAIL_USE_TLS')}")
print(f"MAIL_USE_SSL: {os.getenv('MAIL_USE_SSL')}")

print("\n2. CHECK FLASK-MAIL INSTALLATION")
print("-" * 60)
try:
    from flask_mail import Mail
    print("✅ Flask-Mail installed")
except ImportError:
    print("❌ Flask-Mail NOT installed")
    print("   Run: pip install Flask-Mail")

print("\n3. CHECK FLASK APP CONFIGURATION")
print("-" * 60)
try:
    from app import create_app
    app = create_app()
    with app.app_context():
        print(f"MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
        print(f"MAIL_PORT: {app.config.get('MAIL_PORT')}")
        print(f"MAIL_USE_TLS: {app.config.get('MAIL_USE_TLS')}")
        print(f"Mail Extension: {app.extensions.get('mail')}")
        if app.extensions.get('mail'):
            print("✅ Mail extension initialized")
        else:
            print("❌ Mail extension NOT initialized")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n4. TEST SENDING EMAIL")
print("-" * 60)
try:
    from flask import Flask
    from flask_mail import Mail, Message
    
    app = Flask(__name__)
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 2525))
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    
    mail = Mail(app)
    
    with app.app_context():
        msg = Message(
            'Debug Test',
            recipients=['debug@test.com'],
            body='Debug test email'
        )
        mail.send(msg)
        print("✅ Test email sent successfully")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
```

Run it:
```bash
python debug_email.py
```

---

## 📊 Complete Test Request

Test with Postman or curl:

```bash
curl -X POST http://localhost:5000/toxicity/predict \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "user_email": "test@example.com",
    "user_name": "Test User",
    "location": {"region": "Test", "province": "Test"},
    "date": "2026-02-25"
  }' | python -m json.tool
```

Response should include:
```json
{
  "email_sent": true,
  "image_analysis": { ... },
  "risk_assessment": { ... }
}
```

---

## ✅ Final Checklist

- [ ] User is logged in (email exists)
- [ ] Backend running (`python app.py`)
- [ ] Flask-Mail installed (`pip show Flask-Mail`)
- [ ] `.env` has Mailtrap credentials
- [ ] Frontend sends `user_email` and `user_name`
- [ ] Backend receives email data (debug logs show them)
- [ ] Email send attempts (backend logs show attempt)
- [ ] Response includes `"email_sent"` field
- [ ] Email appears in Mailtrap inbox (https://mailtrap.io)

---

## Getting Stuck?

1. Check all console logs (Expo + Backend)
2. Run `debug_email.py`
3. Restart backend after making changes
4. Verify `.env` has correct credentials
5. Make sure user is logged in before predicting

---

## Files Modified in This Update

✅ `frontend/utils/api.ts` - Added user_email, user_name to interface
✅ `frontend/app/prediction.tsx` - Added AuthContext import and user data passing
✅ `frontend/app/prediction.tsx` - Added detailed console logging

