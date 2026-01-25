# SnapShroom Troubleshooting Guide

## Camera Works But Analysis Fails

### Common Issues and Solutions

#### 1. **Backend Server Not Running**

**Check:**
```bash
# In backend directory
python app.py
```

**Solution:**
- Make sure Flask server is running
- Check terminal for errors
- Verify server is listening on correct port (default: 5000)

#### 2. **Wrong API URL / IP Address**

**Problem:** Frontend can't reach backend

**Solution:**
1. Find your computer's IP address:
   - **Windows:** Open Command Prompt, type `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.102)
   - **Mac/Linux:** Open Terminal, type `ifconfig` or `ip addr`

2. Update `frontend/utils/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000';
   // Example: 'http://192.168.1.102:5000'
   ```

3. **Important:** 
   - Phone and computer must be on the **same WiFi network**
   - For Expo Go, use your computer's local IP (not localhost)
   - For web browser, you can use `localhost:5000`

#### 3. **CORS (Cross-Origin) Errors**

**Symptoms:** Network error in browser console

**Solution:**
Check `backend/config.py` - CORS should allow your frontend origin:
```python
CORS_ORIGINS = [
    "http://localhost:8081",  # Expo web
    "http://localhost:3000",  # React dev
    "exp://*",               # Expo Go
    "*"                      # Allow all (development only)
]
```

#### 4. **Image Encoding Issues**

**Problem:** Base64 image format incorrect

**Solution:**
- The code now automatically strips data URI prefixes
- Check browser console for image size logs
- Ensure camera is capturing images properly

#### 5. **Model Not Loaded**

**Symptoms:** Backend error about missing models

**Solution:**
```bash
cd backend
python train.py --epochs 3
```

This will create:
- `models/mushroom_edibility.pth` (toxicity model)
- `models/species_model.pkl` (species model)

#### 6. **Network Timeout**

**Problem:** Request takes too long

**Solution:**
- Check backend logs for processing time
- Increase timeout in `frontend/utils/api.ts` (currently 60 seconds)
- Ensure models are loaded (check backend startup logs)

### Debugging Steps

#### Step 1: Test Backend Directly

Open browser and visit:
```
http://localhost:5000/
```

Should see:
```json
{
  "status": "SnapShroom backend running",
  "version": "1.0",
  "models_available": {...}
}
```

#### Step 2: Check Backend Logs

When you try to analyze an image, check the backend terminal for:
- "Received prediction request"
- "Processing base64 image"
- "Starting species classification..."
- Any error messages

#### Step 3: Check Frontend Console

In Expo/React Native:
- Open developer menu (shake device or Cmd+D)
- Check console logs
- Look for API request/response logs

#### Step 4: Test API Endpoint Manually

Use curl or Postman to test:
```bash
curl -X POST http://localhost:5000/api/toxicity/predict \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "BASE64_STRING_HERE"}'
```

### Quick Fixes

#### Fix 1: Update API URL
```typescript
// frontend/utils/api.ts
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000';
```

#### Fix 2: Restart Backend
```bash
# Stop current server (Ctrl+C)
cd backend
python app.py
```

#### Fix 3: Clear Expo Cache
```bash
cd frontend
npx expo start -c
```

#### Fix 4: Check Firewall
- Windows Firewall might be blocking port 5000
- Allow Python/Flask through firewall
- Or temporarily disable firewall for testing

### Error Messages Guide

| Error Message | Solution |
|--------------|----------|
| "Cannot connect to backend" | Check IP address, ensure server running |
| "No image provided" | Camera not capturing properly |
| "Invalid image data" | Base64 encoding issue - check logs |
| "Model not found" | Run training script to create models |
| "Timeout" | Backend taking too long - check model loading |
| "CORS error" | Update CORS settings in config.py |

### Testing Checklist

- [ ] Backend server is running
- [ ] Backend accessible at `http://YOUR_IP:5000/`
- [ ] Frontend API URL matches backend IP
- [ ] Phone and computer on same WiFi
- [ ] Models exist in `backend/models/` directory
- [ ] No firewall blocking port 5000
- [ ] Check browser/Expo console for errors
- [ ] Check backend terminal for error logs

### Still Not Working?

1. **Enable Debug Logging:**
   - Backend: Already enabled (check terminal)
   - Frontend: Check Expo console

2. **Test with Simple Image:**
   - Try a small test image first
   - Use a known good image format (JPEG/PNG)

3. **Check Network:**
   - Try accessing backend from phone's browser
   - Verify IP address is correct

4. **Verify Models:**
   ```bash
   ls backend/models/
   # Should see: mushroom_edibility.pth and species_model.pkl
   ```

### Getting Help

When asking for help, provide:
1. Backend terminal output
2. Frontend console logs
3. Error message (exact text)
4. Your IP address configuration
5. Network setup (same WiFi, etc.)

---

**Last Updated:** January 2026