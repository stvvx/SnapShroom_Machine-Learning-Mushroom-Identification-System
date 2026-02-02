# Roboflow-Only Setup: Unified Detection + Classification

## 🎯 What's Changed

### ✅ NEW FILES (USE THESE):
- **backend/train_roboflow.py** - Train on Roboflow (cloud GPU)
- **backend/roboflow_unified_predict.py** - Detect + Classify in one pipeline
- **backend/routes/toxicity_routes_roboflow.py** - Updated Flask routes

### ❌ OLD FILES (ARCHIVE/DELETE):
- backend/predict.py → Replaced by roboflow_unified_predict.py
- backend/detect_mushroom.py → Replaced by roboflow_unified_predict.py
- train_model.py → Replaced by train_roboflow.py
- backend/train.py → No longer needed (use Roboflow instead)

---

## 📋 SETUP STEPS

### 1. Create Two Roboflow Projects

**Project 1: Detection** (`mushroom-detection`)
- Upload images with bounding boxes around mushrooms
- Train YOLOv8 detection model
- Export as PyTorch → `models/detection.pt`

**Project 2: Classification** (`mushroom-edibility`)
- Upload cropped/full mushroom images labeled: EDIBLE or POISONOUS
- Train YOLOv8 classification model
- Export as PyTorch → `models/classification.pt`

### 2. Update Environment Variables

Create/update `.env` in backend directory:
```env
# Roboflow credentials
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_WORKSPACE=your-workspace
ROBOFLOW_DETECTION_PROJECT=your-workspace/mushroom-detection
ROBOFLOW_CLASSIFICATION_PROJECT=your-workspace/mushroom-edibility

# Model paths
DETECTION_MODEL_PATH=models/detection.pt
CLASSIFICATION_MODEL_PATH=models/classification.pt
```

### 3. Export Models from Roboflow

After training on Roboflow:
1. Go to Versions → Latest version
2. Click "Export" 
3. Select "PyTorch" format
4. Download both models
5. Place in `backend/models/` folder

Expected structure:
```
backend/
├── models/
│   ├── detection.pt           (YOLOv8 detection model)
│   └── classification.pt      (YOLOv8 classification model)
└── roboflow_unified_predict.py
```

### 4. Install Dependencies

```bash
pip install roboflow ultralytics torch torchvision python-dotenv pillow requests
```

Or use provided requirements file:
```bash
pip install -r backend/roboflow_requirements.txt
```

### 5. Update Flask App

In `backend/app.py`, replace the old toxicity route:

**OLD:**
```python
from routes.toxicity_routes import toxicity_bp
app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
```

**NEW:**
```python
from routes.toxicity_routes_roboflow import toxicity_bp
app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
```

### 6. Test the Setup

```python
# Test script
from backend.roboflow_unified_predict import RoboflowUnifiedPredictor

predictor = RoboflowUnifiedPredictor(
    detection_model_path="models/detection.pt",
    classification_model_path="models/classification.pt"
)

result = predictor.predict("test_image.jpg")
print(result)
```

---

## 🚀 USAGE

### Single Image Prediction
```python
predictor = RoboflowUnifiedPredictor()
result = predictor.predict("mushroom.jpg")
# Returns: {
#     "status": "success",
#     "total_detections": 2,
#     "mushrooms": [
#         {
#             "id": 0,
#             "edibility": "EDIBLE",
#             "confidence": 0.95,
#             "recommendation": "✅ Safe to eat"
#         }
#     ]
# }
```

### Flask API
```bash
# POST with image file
curl -X POST -F "image=@mushroom.jpg" http://localhost:5000/api/toxicity/predict

# POST with base64
curl -X POST -H "Content-Type: application/json" \
  -d '{"image_base64":"...base64string..."}' \
  http://localhost:5000/api/toxicity/predict
```

### Check API Status
```bash
curl http://localhost:5000/api/toxicity/health
```

---

## 📊 What Each Model Does

### Detection Model (YOLOv8)
```
Input: Full image with mushrooms
↓
Output: Bounding boxes of mushroom locations
Example:
- Found 2 mushrooms at:
  - Box 1: x=100, y=200, w=200, h=200
  - Box 2: x=400, y=150, w=180, h=180
```

### Classification Model (YOLOv8)
```
Input: Cropped mushroom image
↓
Output: EDIBLE or POISONOUS label
Example:
- Image 1: EDIBLE (confidence: 0.95)
- Image 2: POISONOUS (confidence: 0.87)
```

### Combined Pipeline
```
Original Image
    ↓
[Detection Model]  → Find mushrooms
    ↓
[Classification Model] → Classify each → Final Results
    ↓
{
  "mushroom_1": "EDIBLE ✅",
  "mushroom_2": "POISONOUS ❌"
}
```

---

## 🔄 Retraining Workflow

When you want to improve accuracy:

1. Add new images to Roboflow project
2. Create new version
3. Train on Roboflow UI
4. Export as PyTorch
5. Replace `models/detection.pt` or `models/classification.pt`
6. **No code changes needed!** Just restart Flask app

---

## ⚡ Performance Tips

### Speed Up Inference
```python
predictor.predict(
    "image.jpg",
    confidence_threshold=0.6  # Higher threshold = fewer detections, faster
)
```

### Use GPU (if available)
- Models automatically use CUDA if available
- Check: `torch.cuda.is_available()`

### Batch Processing
```python
results = predictor.predict_batch([
    "image1.jpg",
    "image2.jpg",
    "image3.jpg"
])
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Models not found | Export from Roboflow and place in `models/` |
| ROBOFLOW_API_KEY error | Add to `.env` file |
| CUDA out of memory | Reduce image size or use CPU |
| Model accuracy low | Add more training images to Roboflow |
| Slow inference | Check GPU availability, increase confidence threshold |

---

## 📚 Files Reference

### Training
- [train_roboflow.py](../backend/train_roboflow.py) - Train new models

### Prediction
- [roboflow_unified_predict.py](../backend/roboflow_unified_predict.py) - Detection + Classification
- [roboflow_predict.py](../backend/roboflow_predict.py) - API-based inference (optional)

### Routes
- [toxicity_routes_roboflow.py](../backend/routes/toxicity_routes_roboflow.py) - Flask endpoints

### Config
- [roboflow_requirements.txt](../backend/roboflow_requirements.txt) - Dependencies
