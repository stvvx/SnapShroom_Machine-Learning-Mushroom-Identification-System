# 📂 ROBOFLOW FILES ORGANIZATION

## QUICK REFERENCE

Your Roboflow setup is split across multiple files. Here's what matters:

---

## 🟢 ACTIVE ROBOFLOW FILES (USE THESE)

### Core Prediction Engine
- **`backend/roboflow_unified_predict.py`**
  - ⭐ MAIN FILE - Does detection + classification in one pipeline
  - Loads both models and processes mushroom images
  - Returns detection + toxicity results

### Training Script  
- **`backend/train_roboflow.py`**
  - Optional: Use to train on Roboflow using your dataset
  - Can skip if training on Roboflow website directly

### Flask Integration
- **`backend/routes/toxicity_routes_roboflow.py`**
  - API endpoints for predictions
  - Integrates with the prediction engine

### Configuration
- **`backend/roboflow_requirements.txt`**
  - All dependencies needed
  - Install with: `pip install -r roboflow_requirements.txt`

### Documentation
- **`ROBOFLOW_UNIFIED_SETUP.md`**
  - Original setup guide (reference)
- **`ROBOFLOW_DEPLOYMENT_GUIDE.md`** ← YOU ARE HERE
  - Complete deployment workflow

---

## 🔴 LEGACY ROBOFLOW FILES (NOT USED - CAN ARCHIVE/DELETE)

These are older versions replaced by the unified pipeline:

| File | Why Replaced |
|------|-------------|
| `backend/predict.py` | Unified version handles this |
| `backend/detect_mushroom.py` | Unified version handles this |
| `backend/train.py` | Use `train_roboflow.py` instead |
| `backend/roboflow_detect_only.py` | Only does detection, not classification |
| `backend/roboflow_predict.py` | Old prediction script, use unified |
| `train_model.py` | Use `train_roboflow.py` instead |
| `setup_roboflow.py` | Already set up, use `.env` directly |
| `test_roboflow_setup.py` | Just for testing setup |

**Action:** These can be archived in a `legacy/` folder or deleted to clean up

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
SnapShroom/
├── backend/
│   ├── .env                                ← Your credentials go here
│   ├── app.py                             ← Main Flask app
│   ├── roboflow_unified_predict.py        ✅ Core engine
│   ├── train_roboflow.py                  ✅ Training script
│   ├── roboflow_requirements.txt           ✅ Dependencies
│   ├── models/
│   │   ├── detection.pt                   ← Download from Roboflow
│   │   └── classification.pt              ← Download from Roboflow
│   ├── routes/
│   │   └── toxicity_routes_roboflow.py    ✅ API routes
│   └── legacy/                            ← Archived old files
│       ├── predict.py
│       ├── detect_mushroom.py
│       └── ...
│
├── frontend/
│   ├── app/
│   │   ├── camera.tsx                     ← Takes photo
│   │   └── prediction.tsx                 ← Shows results
│   └── .env                               ← API URL for frontend
│
├── ROBOFLOW_DEPLOYMENT_GUIDE.md           ← THIS FILE
├── ROBOFLOW_UNIFIED_SETUP.md              ← Reference docs
└── ...other files...
```

---

## 🚀 YOUR DEPLOYMENT STEPS

### 1️⃣ Prepare Roboflow Projects
```
1. Go to roboflow.com → Create/Select workspace
2. Create Project 1: "mushroom-detection"
   - Upload images with bounding boxes
   - Train YOLOv8 Detection model
3. Create Project 2: "mushroom-edibility"  
   - Upload images labeled EDIBLE/POISONOUS
   - Train YOLOv8 Classification model
```

### 2️⃣ Download Models
```
From Roboflow website:
1. Detection Project → Latest Version → Export → PyTorch → Download
2. Classification Project → Latest Version → Export → PyTorch → Download
3. Place both .pt files in: backend/models/
```

### 3️⃣ Setup Backend Environment
```bash
cd backend

# Install dependencies
pip install -r roboflow_requirements.txt

# Create .env file with:
# ROBOFLOW_API_KEY=your-api-key
# ROBOFLOW_WORKSPACE=your-workspace
# DETECTION_MODEL_PATH=models/detection.pt
# CLASSIFICATION_MODEL_PATH=models/classification.pt
```

### 4️⃣ Start Backend
```bash
python app.py
```

### 5️⃣ Start Frontend
```bash
# In frontend directory
npm start
```

### 6️⃣ Test
- Take a mushroom photo with camera
- Verify prediction appears

---

## 📋 CURRENT ROBOFLOW FILES STATUS

| File | Status | Keep? | Purpose |
|------|--------|-------|---------|
| roboflow_unified_predict.py | ✅ Active | YES | Main prediction pipeline |
| roboflow_requirements.txt | ✅ Active | YES | Dependencies |
| toxicity_routes_roboflow.py | ✅ Active | YES | API endpoints |
| train_roboflow.py | ✅ Active | OPTIONAL | Training script |
| ROBOFLOW_UNIFIED_SETUP.md | 📚 Docs | YES | Reference guide |
| roboflow_predict.py | ❌ Legacy | NO | Replaced by unified |
| roboflow_detect_only.py | ❌ Legacy | NO | Replaced by unified |
| predict.py | ❌ Legacy | NO | Old prediction logic |
| detect_mushroom.py | ❌ Legacy | NO | Old detection logic |
| train.py | ❌ Legacy | NO | Replaced by roboflow version |
| setup_roboflow.py | ❌ Legacy | NO | One-time setup helper |
| test_roboflow_setup.py | ❌ Legacy | NO | Test file only |

---

## ✅ NEXT ACTIONS

1. **Review ROBOFLOW_DEPLOYMENT_GUIDE.md** (the complete guide)
2. **Prepare your Roboflow projects** with training data
3. **Export models** once training completes
4. **Fill in `backend/.env`** with your credentials
5. **Run `pip install -r roboflow_requirements.txt`**
6. **Start backend and test camera feature**

---

You're all set! Follow the deployment guide step-by-step and your mushroom detection app will be live! 🍄✨
