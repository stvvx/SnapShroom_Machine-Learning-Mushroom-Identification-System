# Roboflow Integration Guide for SnapShroom

## Setup Instructions

### 1. Install Required Packages
Add these to your `requirements.txt`:
```
roboflow==1.1.11
ultralytics==8.0.205
onnx==1.16.0
onnxruntime==1.17.0
```

Install with:
```bash
pip install roboflow ultralytics
```

### 2. Get Your Roboflow API Key
1. Sign up at https://roboflow.com
2. Create a new project (e.g., "mushroom-detection")
3. Upload your mushroom dataset
4. Go to Settings → API Keys
5. Copy your private API key

### 3. Set Environment Variables
Create a `.env` file in the backend directory:
```
ROBOFLOW_API_KEY=your-api-key-here
ROBOFLOW_PROJECT=your-workspace/mushroom-detection
ROBOFLOW_MODEL_PATH=models/best.pt
```

### 4. Download Dataset from Roboflow

```python
from backend.roboflow_train import download_roboflow_dataset
import os

download_roboflow_dataset(
    api_key=os.getenv("ROBOFLOW_API_KEY"),
    project_url=os.getenv("ROBOFLOW_PROJECT"),
    model_type="yolov8",
    output_dir="roboflow_dataset"
)
```

### 5. Train Model on Roboflow

Option A: Train via Roboflow Web UI (Recommended)
- Go to your Roboflow project
- Click "Train"
- Choose YOLOv8 or YOLOv5
- Wait for training to complete (usually faster on Roboflow servers)

Option B: Train Locally
```python
from backend.roboflow_train import train_roboflow_model
import os

train_roboflow_model(
    api_key=os.getenv("ROBOFLOW_API_KEY"),
    project_url=os.getenv("ROBOFLOW_PROJECT"),
    model_type="yolov8",
    task="detect",  # or "classify"
    epochs=100
)
```

### 6. Export Model

```python
from backend.roboflow_train import export_roboflow_model
import os

export_roboflow_model(
    api_key=os.getenv("ROBOFLOW_API_KEY"),
    project_url=os.getenv("ROBOFLOW_PROJECT"),
    version_id=1,
    export_format="pytorch",  # or "onnx", "tensorflow"
    output_dir="models"
)
```

## Using Roboflow in Your Application

### Option 1: API-Based Inference (No Local Model)
```python
from backend.roboflow_predict import RoboflowPredictor
import os

predictor = RoboflowPredictor(
    api_key=os.getenv("ROBOFLOW_API_KEY"),
    project_url=os.getenv("ROBOFLOW_PROJECT")
)

result = predictor.predict_image("path/to/mushroom.jpg")
# Returns: {"result": "EDIBLE", "confidence": 0.95, "detections": 1}
```

Pros:
- No local model file needed
- Always up-to-date predictions
- Roboflow handles model management

Cons:
- Requires internet connection
- API rate limits
- Latency from network requests

### Option 2: Local Model Inference (Exported Model)
```python
from backend.roboflow_predict import RoboflowLocalPredictor

predictor = RoboflowLocalPredictor("models/best.pt")
result = predictor.predict("path/to/mushroom.jpg")
```

Pros:
- Works offline
- Faster inference
- No API limits

Cons:
- Requires local model file
- Manual updates when model changes

### Option 3: Hybrid (Recommended for Production)
Use local model by default, fall back to API if local model is outdated:

```python
from backend.roboflow_predict import RoboflowLocalPredictor, RoboflowPredictor
import os

try:
    # Try local model first (faster)
    predictor = RoboflowLocalPredictor("models/best.pt")
    result = predictor.predict("path/to/mushroom.jpg")
except FileNotFoundError:
    # Fall back to API if local model not found
    predictor = RoboflowPredictor(
        api_key=os.getenv("ROBOFLOW_API_KEY"),
        project_url=os.getenv("ROBOFLOW_PROJECT")
    )
    result = predictor.predict_image("path/to/mushroom.jpg")
```

## Integrating with Flask Routes

Update your toxicity_routes.py:

```python
from flask import Blueprint, request, jsonify
from backend.roboflow_predict import RoboflowLocalPredictor, RoboflowPredictor
import os

toxicity_bp = Blueprint('toxicity', __name__)

# Initialize predictor
try:
    predictor = RoboflowLocalPredictor("models/best.pt")
except FileNotFoundError:
    predictor = RoboflowPredictor(
        api_key=os.getenv("ROBOFLOW_API_KEY"),
        project_url=os.getenv("ROBOFLOW_PROJECT")
    )

@toxicity_bp.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    file.save("temp_image.jpg")
    
    result = predictor.predict("temp_image.jpg")
    
    return jsonify(result), 200
```

## File Structure
```
backend/
├── roboflow_train.py          # Training and export utilities
├── roboflow_predict.py        # Inference classes
├── predict.py                 # Original predict.py
├── .env                        # Environment variables (ADD TO .gitignore)
├── models/
│   ├── best.pt                # Exported Roboflow model (YOLOv8)
│   └── mushroom_edibility.pth # Original PyTorch model
└── roboflow_dataset/          # Downloaded dataset from Roboflow
    ├── train/
    ├── val/
    └── test/
```

## Switching Between Detection & Classification

### For Detection (Bounding Boxes)
```python
train_roboflow_model(
    api_key=api_key,
    project_url=project_url,
    model_type="yolov8",
    task="detect"  # ← Detection task
)
```

### For Classification (Classes Only)
```python
train_roboflow_model(
    api_key=api_key,
    project_url=project_url,
    model_type="yolov8",
    task="classify"  # ← Classification task
)
```

## Common Issues & Solutions

### Issue: "No module named roboflow"
Solution: `pip install roboflow`

### Issue: API rate limit exceeded
Solution: Use local model export or upgrade Roboflow plan

### Issue: Model accuracy issues
Solution:
1. Add more images to your dataset
2. Use Roboflow augmentation options
3. Try different model types (YOLOv8 vs YOLOv5)
4. Adjust epochs and learning rate

### Issue: Can't find exported model
Solution: Make sure you downloaded it from Roboflow → Versions → Export → PyTorch

## Next Steps
1. Sign up at Roboflow.com
2. Create a project and upload mushroom images
3. Train using the web UI
4. Export as PyTorch
5. Update `.env` with your API key
6. Test with `roboflow_predict.py`

