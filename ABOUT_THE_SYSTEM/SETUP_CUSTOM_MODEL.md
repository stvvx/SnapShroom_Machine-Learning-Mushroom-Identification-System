# 🍄 SnapShroom Setup Guide - Custom Model Only (No Roboflow)

#

## ✅ What You're Using Now

### Backend
- **Model Training**: `backend/train_custom.py` ← Use this!
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

---

## 📦 Requirements

Already installed:
- `torch` - Deep learning
- `torchvision` - Image processing
- `opencv-python` - Image handling
- `pandas` - CSV reading
- `numpy` - Math operations

---

## ✨ Frontend Integration

The frontend automatically uses your model:
1. User takes mushroom photo
2. Sends to API
3. Gets predictions from your trained model
4. Shows results with location data

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Out of memory | Reduce BATCH_SIZE to 8-16 |
| Low accuracy | More images, more epochs |
| Slow training | Use GPU (check DEVICE shows CUDA) |
| Model not found | Run train_custom.py first |

---

## 🎯 Next Steps

1. ✅ Run cleanup script
2. ✅ Organize images in `datasets/mushroom_dataset/`
3. ✅ Run `python train_custom.py`
4. ✅ Start backend with `python app.py`
5. ✅ Test on mobile/web app

---

**You're all set! No more Roboflow needed.** 🎉
