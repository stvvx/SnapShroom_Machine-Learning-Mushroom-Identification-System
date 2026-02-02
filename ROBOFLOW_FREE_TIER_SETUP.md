# 🍄 ROBOFLOW FREE TIER SETUP (API-Based)

**Great news!** You don't need to download models anymore. We're using Roboflow's **cloud inference API** which is completely free! 🎉

---

## ✅ What Changed

| Aspect | Before | Now |
|--------|--------|-----|
| **Model Download** | Required (Premium) | ❌ Not needed |
| **Inference Method** | Local GPU/CPU | ☁️ Roboflow Cloud API |
| **Cost** | Varies | 🆓 FREE |
| **Speed** | Instant (local) | ~1-2 seconds (cloud) |
| **Internet Required** | No | Yes |

---

## 🚀 QUICK START (3 Steps)

### Step 1: Verify Your `.env` File
Make sure `backend/.env` has these values:
```env
ROBOFLOW_API_KEY=your-api-key-here
ROBOFLOW_WORKSPACE=tel
ROBOFLOW_DETECTION_PROJECT=tel/mushroom_detection
ROBOFLOW_CLASSIFICATION_PROJECT=tel/mushroom_classificationation
```

**Get your API key:**
1. Go to https://roboflow.com
2. Settings → API → Copy your **Private API Key**
3. Paste into `ROBOFLOW_API_KEY=` in `.env`

### Step 2: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
# Or if you want just Roboflow:
pip install roboflow requests python-dotenv
```

### Step 3: Start Backend
```bash
python app.py
```

Expected output:
```
✅ Toxicity/Detection routes loaded (Roboflow API - Free Tier)
✅ SnapShroom API initialized
 * Running on http://127.0.0.1:5000
```

---

## 📱 Test It

Once backend is running, test the `/api/toxicity/health` endpoint:

**In browser or Postman:**
```
GET http://localhost:5000/api/toxicity/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "roboflow-api-based",
  "timestamp": "2026-02-02T12:00:00.000000"
}
```

---

## 🎥 How It Works

```
User Camera Photo
    ↓
Frontend (React Native)
    ↓ (sends Base64 image)
Backend: /api/toxicity/predict
    ↓
Roboflow Cloud API (Internet)
    ├── Detection Model → Finds mushroom location
    └── Classification Model → Labels as EDIBLE/POISONOUS
    ↓
Results returned to Frontend
    ↓
Display: Mushroom found! SAFE/DANGEROUS
```

---

## 📚 Files Changed

**New files:**
- ✅ `backend/roboflow_api_predict.py` - API-based predictor
- ✅ `backend/routes/toxicity_routes_roboflow_api.py` - Flask routes

**Modified files:**
- ✅ `backend/app.py` - Updated blueprint import

**No longer needed:**
- ❌ `roboflow_unified_predict.py` (local model version)
- ❌ `models/detection.pt` and `models/classification.pt` (no download needed)

---

## 🔧 API Endpoints

### POST /api/toxicity/predict
**Predict mushroom edibility**

Request:
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Response:
```json
{
  "success": true,
  "detection": {
    "found": true,
    "confidence": 0.95,
    "bounding_box": [x, y, width, height]
  },
  "classification": {
    "label": "EDIBLE",
    "confidence": 0.92,
    "toxicity_level": "SAFE"
  }
}
```

### GET /api/toxicity/health
**Check service status**

Response:
```json
{
  "status": "healthy",
  "service": "roboflow-api-based",
  "timestamp": "2026-02-02..."
}
```

### GET /api/toxicity/info
**Get service info**

Response:
```json
{
  "configured": true,
  "service": "Roboflow Cloud API (Free Tier)",
  "detection_project": "tel/mushroom_detection",
  "classification_project": "tel/mushroom_classificationation",
  "api_endpoint": "https://detect.roboflow.com",
  "note": "Uses Roboflow's cloud inference - no local GPU needed!"
}
```

---

## ⚡ Advantages

✅ **No GPU Required** - Works on any machine  
✅ **No Model Download** - No storage space needed  
✅ **Completely Free** - Free Roboflow API tier  
✅ **Always Up-to-Date** - Roboflow updates models for you  
✅ **Scalable** - Handle multiple requests easily  

---

## ⚠️ Limitations

⏱️ **Slower** - API calls take 1-2 seconds (vs instant local)  
🌐 **Internet Required** - No offline predictions  
🚦 **Rate Limited** - Free tier has request limits  

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
**Fix:** Get your **PRIVATE** API key from Roboflow Settings, not the public one.

### Error: "Invalid project name"
**Fix:** Check your project names in Roboflow:
- Go to Projects → Click your detection project
- URL should be: `app.roboflow.com/WORKSPACE/PROJECT`
- Update `.env` with exact format: `WORKSPACE/PROJECT`

### Slow Response
**Normal!** API calls take 1-2 seconds. If it's slower:
- Check internet connection
- Check if Roboflow is having issues
- Try a smaller image (reduces processing time)

### No Mushroom Detected
- Ensure mushroom is clearly visible
- Good lighting helps detection
- Try a different angle

---

## 🎯 Next Steps

1. ✅ Update `.env` with API key
2. ✅ Run `python app.py`
3. ✅ Test with `/api/toxicity/health`
4. ✅ Start frontend with `npm start`
5. ✅ Take mushroom photos with camera
6. ✅ Verify predictions appear!

---

**You're all set!** Your SnapShroom app is now using Roboflow's free cloud API. 🍄✨

**Last Updated:** February 2, 2026
