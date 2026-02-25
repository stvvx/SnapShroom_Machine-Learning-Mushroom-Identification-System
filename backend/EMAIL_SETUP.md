# Email Notification System - Implementation Guide

## Setup Complete ✅

The email notification system is now fully integrated into your SnapShroom backend using Mailtrap SMTP.

### What Was Added

1. **Dependencies**: Flask-Mail 0.9.1 added to requirements.txt
2. **Configuration**: Mailtrap SMTP credentials in .env
3. **Flask Integration**: Mail extension initialized in app.py
4. **Email Service**: New `services/email_service.py` with two functions:
   - `send_prediction_email()` - Sends detailed prediction results
   - `send_alert_email()` - Sends alerts for high-risk mushrooms
5. **Route Integration**: `/toxicity/predict` endpoint now sends emails automatically

### Mailtrap Configuration

The following credentials are configured in your `.env` file:

```
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=a1dd469610546c
MAIL_PASSWORD=51dd58d7a290f5
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_DEFAULT_SENDER=noreply@snapshroom.app
```

These are sandbox credentials for testing. When moving to production, update these with your production Mailtrap account credentials.

---

## Using the Prediction Email Feature

### Frontend Request Format

When calling the `/toxicity/predict` endpoint, include user email and name in the JSON payload:

```json
{
    "image_base64": "data:image/jpeg;base64,...",
    "user_email": "user@example.com",
    "user_name": "John Doe",
    "location": "Central Park, NY",
    "date": "2026-02-25",
    "user_context": {
        "age": 30,
        "allergies": []
    }
}
```

### Backend Response

After successful prediction, the response will include:

```json
{
    "timestamp": "2026-02-25T10:30:00Z",
    "email_sent": true,
    "image_analysis": {
        "species": { ... },
        "toxicity": { ... },
        "habitat": { ... }
    },
    "risk_assessment": { ... },
    "recommendations": [ ... ],
    "safety_actions": [ ... ]
}
```

---

## Email Features

### 1. Prediction Result Email
Sent automatically after every prediction with:
- 🍄 Mushroom species identification
- 📊 Confidence level
- 🌱 Edibility status
- ⚠️ Risk level assessment
- 💡 Safety recommendations
- 🚨 Critical safety actions

### 2. High-Risk Alert Email
Automatically triggered for mushrooms with:
- **High** risk level
- **Critical** risk level
- **Extreme** risk level

Alert email includes:
- 🚨 Clear warning
- Alert type (toxic, rare, dangerous, etc.)
- Specific threat details
- Do NOT consume warning

---

## Installation & Deployment

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Update Environment Variables

Ensure your `.env` file has the Mailtrap credentials:

```bash
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
```

### 3. Test Email Sending

You can test email functionality by checking Mailtrap's demo inbox:
1. Go to https://mailtrap.io
2. Login to your account
3. Navigate to **Demo Inbox**
4. You'll see all test emails sent from your application

### 4. Production Setup

When deploying to production:
1. Create a production Mailtrap account
2. Update credentials in `.env`
3. Consider setting `MAIL_DEFAULT_SENDER` to your domain email
4. Update email templates with your branding

---

## Email Template Details

The prediction email includes:
- **Professional HTML design** with gradient headers
- **Color-coded sections** (success/warning/danger)
- **Structured information** display
- **Responsive layout** for all devices
- **Safety disclaimer** about professional consultation

---

## Troubleshooting

### Emails Not Sending

1. **Check Flask-Mail installation**:
   ```bash
   pip show Flask-Mail
   ```

2. **Verify environment variables**:
   ```bash
   echo %MAIL_SERVER%
   echo %MAIL_PORT%
   ```

3. **Check application logs** for email errors
   ```
   [ERROR] Failed to send prediction email to user@example.com: ...
   ```

4. **Verify Mailtrap connection**:
   - Test credentials at https://mailtrap.io
   - Port 2525 should be open
   - TLS should be enabled

5. **Debug in Python**:
   ```python
   from flask_mail import Mail, Message
   from flask import Flask
   app = Flask(__name__)
   # Configure mail...
   mail = Mail(app)
   msg = Message('Test', recipients=['user@example.com'], body='Test')
   mail.send(msg)
   ```

---

## Frontend Integration Example (React Native)

```javascript
// Send prediction request with email
const sendPrediction = async (imageBase64, userEmail) => {
  try {
    const response = await fetch('http://your-backend-url/toxicity/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        user_email: userEmail,
        user_name: 'John Doe',
        location: 'Central Park',
        date: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    
    if (data.email_sent) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('⚠️ Prediction complete but email not sent');
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Files Modified/Created

- ✅ `backend/requirements.txt` - Added Flask-Mail
- ✅ `backend/.env` - Added Mailtrap credentials
- ✅ `backend/app.py` - Initialized Flask-Mail
- ✅ `backend/services/email_service.py` - New email service (Created)
- ✅ `backend/routes/toxicity_routes.py` - Integrated email sending

---

## Next Steps

1. **Test emails** by sending a prediction request with a valid email
2. **Check Mailtrap inbox** to see the emails
3. **Customize templates** by editing `services/email_service.py`
4. **Add error handling** for failed emails in your frontend
5. **Migrate to production** when ready

---

Done! Your mushroom prediction system now automatically notifies users via email. 🎉
