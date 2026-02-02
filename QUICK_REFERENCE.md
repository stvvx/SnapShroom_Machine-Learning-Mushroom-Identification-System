# 🍄 SnapShroom Roboflow - Quick Reference Card

## 📌 Essential Commands

```bash
# Setup
python setup_roboflow.py                    # Interactive setup
pip install -r backend/roboflow_requirements.txt  # Install dependencies

# Testing
python test_roboflow_setup.py              # Verify everything works

# Run Application
python backend/app.py                       # Start Flask server

# Delete Old Files
rm backend/predict.py
rm backend/detect_mushroom.py
rm backend/train.py
rm train_model.py
```

---

## 🔧 Configuration

### `.env` (Create in `backend/` directory)
```env
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_WORKSPACE=your-workspace
DETECTION_MODEL_PATH=models/detection.pt
CLASSIFICATION_MODEL_PATH=models/classification.pt
```

### Models Location
```
backend/models/
├── detection.pt        (Export from Roboflow detection project)
└── classification.pt   (Export from Roboflow classification project)
```

---

## 🚀 API Endpoints

### Predict Endpoint
```bash
curl -X POST \
  -F "image=@mushroom.jpg" \
  http://localhost:5000/api/toxicity/predict
```

### Response Format
```json
{
  "status": "success",
  "total_detections": 1,
  "mushrooms": [
    {
      "id": 0,
      "edibility": "EDIBLE",
      "edibility_confidence": 0.95,
      "recommendation": "✅ Safe to eat"
    }
  ]
}
```

### Health Check
```bash
curl http://localhost:5000/api/toxicity/health
```

---

## 📝 File Reference

| File | Purpose | Location |
|------|---------|----------|
| train_roboflow.py | Train on Roboflow | backend/ |
| roboflow_unified_predict.py | Run predictions | backend/ |
| toxicity_routes_roboflow.py | Flask endpoints | backend/routes/ |
| roboflow_requirements.txt | Dependencies | backend/ |

---

## 🔄 Workflow

```
1. Create Roboflow Projects
   ├─ mushroom-detection (bounding boxes)
   └─ mushroom-edibility (EDIBLE/POISONOUS)
         ↓
2. Train Models
   ├─ YOLOv8 detection
   └─ YOLOv8 classification
         ↓
3. Export Models
   ├─ detection.pt → backend/models/
   └─ classification.pt → backend/models/
         ↓
4. Setup Environment
   ├─ Create backend/.env
   └─ Install dependencies
         ↓
5. Test
   └─ python test_roboflow_setup.py
         ↓
6. Deploy
   └─ python backend/app.py
```

---

## 📊 Prediction Pipeline

```
Image → Detection Model → Detect Mushrooms
         (YOLOv8)            (boxes + location)
              ↓
         For each mushroom:
              ↓
       Classification Model → EDIBLE/POISONOUS
         (YOLOv8)             + Confidence
              ↓
           Result
```

---

## ✅ Verification Steps

```bash
# 1. Models exist
ls -la backend/models/detection.pt
ls -la backend/models/classification.pt

# 2. Environment configured
cat backend/.env | grep ROBOFLOW_API_KEY

# 3. Dependencies installed
pip list | grep -E "roboflow|ultralytics|torch"

# 4. All checks pass
python test_roboflow_setup.py

# 5. API responds
curl http://localhost:5000/api/toxicity/health
```

---

## 🐛 Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Models not found | Export from Roboflow → Save to `backend/models/` |
| API key error | Add `ROBOFLOW_API_KEY` to `backend/.env` |
| Import errors | `pip install -r backend/roboflow_requirements.txt` |
| Slow inference | Check CUDA: `python -c "import torch; print(torch.cuda.is_available())"` |
| Old files conflicting | Delete or rename `backend/predict.py`, `backend/detect_mushroom.py` |

---

## 📚 Documentation Links

- **Full Setup**: [ROBOFLOW_UNIFIED_SETUP.md](ROBOFLOW_UNIFIED_SETUP.md)
- **Quick Ref**: [ROBOFLOW_READY.md](ROBOFLOW_READY.md)
- **Checklist**: [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
- **Complete**: [ROBOFLOW_INTEGRATION_COMPLETE.md](ROBOFLOW_INTEGRATION_COMPLETE.md)

---

## 🔑 Key Points

✅ Use Roboflow cloud training (10x faster)  
✅ Export models as PyTorch  
✅ Place in `backend/models/` directory  
✅ Update Flask app imports  
✅ Run `test_roboflow_setup.py` to verify  
✅ Test API with real images  
✅ Delete old prediction files  

---

## 🎯 What's New

- `train_roboflow.py` - Cloud training
- `roboflow_unified_predict.py` - Unified predictions
- `toxicity_routes_roboflow.py` - Updated Flask routes
- `test_roboflow_setup.py` - Verification
- `setup_roboflow.py` - Setup wizard

---

## ⏱️ Typical Timeline

| Step | Time |
|------|------|
| Create Roboflow projects | 10 min |
| Upload training data | 30 min |
| Train detection model | 10-20 min |
| Train classification model | 10-20 min |
| Export models | 5 min |
| Setup local environment | 10 min |
| Test API | 5 min |
| **Total** | **~1.5 hours** |

---

**Print this card and keep it handy during setup!**

Version 1.0 | February 1, 2026
