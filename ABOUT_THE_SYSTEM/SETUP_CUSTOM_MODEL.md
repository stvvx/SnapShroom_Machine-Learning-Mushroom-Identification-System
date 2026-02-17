# 🍄 SnapShroom Setup Guide - Custom Model Only (No Roboflow)

#

## ✅ What You're Using Now

### Backend
- **Model Training**: 
python train_classification.py --epochs 30
python train_detection.py --epochs 50
- **Model Type**: PyTorch ResNet50 (CPU/GPU compatible)
- **Prediction Routes**: `backend/routes/toxicity_routes_custom.py`
- **Database**: MongoDB (for user data)

### Key Paths
- **Models**: `backend/models/mushroom_classifier.pth`
- **Classes**: `backend/models/mushroom_classes.json`
- **Dataset**: `backend/datasets/mushroom_dataset/`
- **CSV Data**: `mushrooms10kinds.csv`

---

## 🚀 Workflow: Train → Deploy

### 1️⃣ Prepare Dataset

Place mushroom images in organized folders:
```
backend/datasets/mushroom_dataset/
├── oyster_mushroom/
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
├── shiitake/
│   ├── photo1.jpg
│   └── ...
└── ... (other mushroom types)
```

### 2️⃣ Train Custom Model

```bash
cd backend
python train_custom.py
```

This will:
- ✅ Load all images from folders
- ✅ Split into train/validation (80/20)
- ✅ Train ResNet50 for 20 epochs
- ✅ Save best model to `models/mushroom_classifier.pth`
- ✅ Save class names to `models/mushroom_classes.json`

**Expected Training Time**: 5-30 minutes (depends on GPU)

### 3️⃣ Start Backend

```bash
cd backend
python app.py
```

Server runs at: `http://localhost:5000`

### 4️⃣ Test the API

```bash
# Upload an image and get predictions
POST /api/toxicity/predict
```

---

## 📊 Model Architecture

```
Input Image (224x224)
     ↓
ResNet50 (Pre-trained)
     ↓
Feature Extraction
     ↓
Classification Head
     ↓
Output: Mushroom Type + Confidence
```

---

## 🔧 Configuration

Edit `backend/train_custom.py`:

```python
BATCH_SIZE = 32          # Reduce if out of memory
EPOCHS = 20              # Increase for better accuracy
LEARNING_RATE = 0.001    # Adjust learning speed
IMAGE_SIZE = 224         # ResNet50 standard size
```
