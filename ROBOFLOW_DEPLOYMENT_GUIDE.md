# 🍄 ROBOFLOW DEPLOYMENT GUIDE
**Complete workflow for deploying your mushroom detection & classification model**

---

## 📊 CURRENT STATUS

✅ **Roboflow Integration Ready**
- Unified detection + classification pipeline configured
- Flask routes prepared for Roboflow predictions
- Environment variables system in place
- Dependencies documented

---

## 🎯 DEPLOYMENT CHECKLIST

### STEP 1: Prepare Your Roboflow Projects
- [ ] Create/Access your Roboflow workspace at https://roboflow.com
- [ ] Create **Project 1**: `mushroom-detection` (YOLOv8 Detection)
  - Upload images with bounding boxes around mushrooms
  - Let Roboflow handle augmentation
  - Train on Roboflow cloud GPU
- [ ] Create **Project 2**: `mushroom-edibility` (YOLOv8 Classification)
  - Upload mushroom images labeled: `EDIBLE` or `POISONOUS`
  - Train on Roboflow cloud GPU

### STEP 2: Export Models from Roboflow
After training completes:
- [ ] Go to each project → **Versions** → Latest version
- [ ] Click **"Export"** button
- [ ] Select **"PyTorch"** format
- [ ] Download both models (`.pt` files)
- [ ] Place in `backend/models/` folder:
  ```
  backend/models/
  ├── detection.pt          (YOLOv8 detection model)
  └── classification.pt     (YOLOv8 classification model)
  ```

### STEP 3: Configure Environment Variables
- [ ] Open `backend/.env` file
- [ ] Fill in your Roboflow credentials:
  ```env
  # Get from: https://roboflow.com → Settings → API
  ROBOFLOW_API_KEY=your-api-key-here
  ROBOFLOW_WORKSPACE=your-workspace-name
  ROBOFLOW_DETECTION_PROJECT=your-workspace/mushroom-detection
  ROBOFLOW_CLASSIFICATION_PROJECT=your-workspace/mushroom-edibility
  
  # Model paths (should match export location)
  DETECTION_MODEL_PATH=models/detection.pt
  CLASSIFICATION_MODEL_PATH=models/classification.pt
  ```

### STEP 4: Install Dependencies
```bash
cd backend
pip install -r roboflow_requirements.txt
```

Or manually install:
```bash
pip install roboflow ultralytics torch torchvision python-dotenv pillow requests
```

### STEP 5: Verify Setup
```bash
cd backend
python -c "from roboflow_unified_predict import RoboflowUnifiedPredictor; print('✅ All imports successful!')"
```

### STEP 6: Start Backend Server
```bash
cd backend
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Loaded detection model from models/detection.pt
 * Loaded classification model from models/classification.pt
```

### STEP 7: Test with Frontend
- [ ] Ensure ngrok tunnel is active
- [ ] Start frontend: `npm start` (from frontend directory)
- [ ] Take a mushroom photo using the camera
- [ ] Verify prediction response

---

## 📁 FILE ORGANIZATION

### ✅ KEEP (Active Files)
```
backend/
├── roboflow_unified_predict.py     ← Main prediction pipeline
├── train_roboflow.py               ← Training script (optional)
├── roboflow_requirements.txt        ← Dependencies
├── routes/
│   └── toxicity_routes_roboflow.py ← Flask endpoints
└── models/
    ├── detection.pt                ← Downloaded from Roboflow
    └── classification.pt           ← Downloaded from Roboflow
```

### ⚠️ ARCHIVE (Legacy - Not Used)
```
backend/
├── predict.py              → Replaced by roboflow_unified_predict.py
├── detect_mushroom.py      → Replaced by roboflow_unified_predict.py
├── train.py                → Replaced by train_roboflow.py
├── roboflow_detect_only.py → Replaced by unified version
└── roboflow_predict.py     → Replaced by unified version
```

### 📚 DOCUMENTATION (Reference)
```
Root/
├── ROBOFLOW_SETUP.md                ← Original setup notes
├── ROBOFLOW_UNIFIED_SETUP.md        ← Unified pipeline docs
├── ROBOFLOW_INTEGRATION_COMPLETE.md ← Integration status
└── ROBOFLOW_DEPLOYMENT_GUIDE.md     ← THIS FILE
```

---

## 🔧 ARCHITECTURE OVERVIEW

```
User Camera Photo
    ↓
Frontend (React Native)
    ↓ (Upload to API)
Backend Flask App
    ↓
Roboflow Unified Predictor
    ├── Detection Model (YOLOv8)
    │   └── Detects mushroom location & bounds
    ├── Crop Detected Region
    └── Classification Model (YOLOv8)
        └── Classifies as EDIBLE or POISONOUS
    ↓
Return Results (Confidence, Toxicity)
    ↓
Frontend Display Result
```

---

## 🚀 API ENDPOINT

### Prediction Endpoint
**POST** `/api/toxicity/predict`

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
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

---

## ⚡ QUICK COMMANDS

### Setup Fresh Installation
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
pip install -r roboflow_requirements.txt

# 3. Create .env with your credentials
python ../setup_roboflow.py

# 4. Start server
python app.py
```

### Test Prediction
```bash
cd backend
python -c "
from roboflow_unified_predict import RoboflowUnifiedPredictor
predictor = RoboflowUnifiedPredictor('models/detection.pt', 'models/classification.pt')
print('✅ Predictor initialized successfully!')
"
```

### Train New Model (Optional)
```bash
python train_roboflow.py
```

---

## 🐛 TROUBLESHOOTING

### Issue: Models not found
```
FileNotFoundError: models/detection.pt
```
**Fix:** 
1. Verify models are in `backend/models/`
2. Check `DETECTION_MODEL_PATH` in `.env`
3. Re-download from Roboflow if missing

### Issue: Roboflow API key invalid
```
roboflow.api.AuthenticationError
```
**Fix:**
1. Go to https://roboflow.com → Settings → API
2. Copy your **private API key** (not public)
3. Update `ROBOFLOW_API_KEY` in `.env`

### Issue: Model inference slow
- Ensure GPU available: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`
- Or use CPU (slower but works)

### Issue: Classification always returns same label
- Check if both models are properly loaded
- Verify classification model was trained with correct labels (EDIBLE/POISONOUS)

---

## 📞 USEFUL LINKS

- **Roboflow Workspace**: https://roboflow.com
- **YOLOv8 Documentation**: https://docs.ultralytics.com/
- **PyTorch Docs**: https://pytorch.org/docs/
- **Expo Camera API**: https://docs.expo.dev/versions/latest/sdk/camera/

---

## ✅ DEPLOYMENT SUCCESS INDICATORS

After completing all steps, you should see:
- ✅ Backend running on port 5000
- ✅ Camera captures photo successfully
- ✅ Photo uploads to backend
- ✅ Prediction API returns mushroom detection & toxicity
- ✅ Results display on frontend

---

**Last Updated:** February 2, 2026
**Status:** 🟢 Ready for Deployment
