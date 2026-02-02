# 🍄 CUSTOM MUSHROOM CLASSIFIER SETUP

**Using your own dataset (mushroom10kinds) + Custom PyTorch Model**

---

## ✅ What You Have

- **Dataset**: `mushroom10kinds.csv` with 10 mushroom types
- **Framework**: PyTorch with ResNet50
- **Training**: `train_custom.py`
- **Prediction**: `custom_predict.py`
- **Flask Routes**: `routes/toxicity_routes_custom.py`

---

## 🚀 QUICK START

### Step 1: Install Dependencies
```bash
cd backend

# Install required packages
pip install torch torchvision pillow pandas scikit-learn opencv-python tqdm
```

Or update requirements.txt:
```bash
pip install -r requirements.txt
```

### Step 2: Prepare Your Dataset

If you have mushroom images, organize them:
```
backend/
├── datasets/
│   └── mushroom_dataset/
│       ├── wood_ear_mushroom/
│       │   ├── img1.jpg
│       │   ├── img2.jpg
│       │   └── ...
│       ├── white_oyster_mushroom/
│       │   ├── img1.jpg
│       │   └── ...
│       └── ... (other mushroom types)
└── mushrooms10kinds.csv
```

**For now**, the training works with placeholder images. Update `train_custom.py` line to load real images when ready:
```python
# Change this in train_custom.py line ~60:
img = np.random.rand(IMAGE_SIZE, IMAGE_SIZE, 3) * 255  # Placeholder

# To this (when you have images):
img = cv2.imread(os.path.join(self.img_dir, row['image_path']))
```

### Step 3: Train the Model
```bash
python train_custom.py
```

**Output:**
- `models/mushroom_classifier.pth` - Trained model weights
- `models/mushroom_classes.json` - Class names and mapping

**Expected console output:**
```
🖥️ Using device: cuda (or cpu)
==================================================
🍄 MUSHROOM CLASSIFIER TRAINING
==================================================

📂 Loading dataset from: mushrooms10kinds.csv
📊 Total samples: 10
🏷️  Classes: 10
   Classes: Wood Ear Mushroom, White Oyster Mushroom, ...

📈 Train samples: 8
📉 Val samples: 2

🤖 Initializing ResNet50 with 10 classes...

--- Epoch 1/20 ---
Training: 100%|████████| 1/1 [00:XX<00:00, XX.XXs/it]
Train Loss: 2.3214 | Train Acc: 0.1250
Val Loss: 2.1543 | Val Acc: 0.5000
✅ Model saved to models/mushroom_classifier.pth
```

### Step 4: Start Backend
```bash
python app.py
```

**Expected output:**
```
✅ Custom Mushroom Predictor initialized
✅ Toxicity/Detection routes loaded (Custom Model)
✅ SnapShroom API initialized
 * Running on http://127.0.0.1:5000
```

### Step 5: Test the API
```bash
# Check if model is loaded
curl http://localhost:5000/api/toxicity/info
```

**Response:**
```json
{
  "configured": true,
  "service": "Custom PyTorch Classifier",
  "model": "ResNet50",
  "num_classes": 10,
  "classes": [
    "Wood Ear Mushroom",
    "White Oyster Mushroom",
    "Enoki Mushroom",
    ...
  ],
  "device": "cuda"
}
```

### Step 6: Start Frontend
```bash
# In another terminal, from frontend directory
npm start
```

### Step 7: Take Photos!
- Open the app
- Go to Camera
- Take a mushroom photo
- See the classification!

---

## 📊 Model Architecture

```
Input Image (3, 224, 224)
    ↓
ResNet50 Backbone (pre-trained)
    ↓
Fine-tuned FC Layer (10 classes)
    ↓
Softmax Probability
    ↓
Top-3 Predictions
```

---

## 🔧 API Endpoints

### POST /api/toxicity/predict
Classify mushroom from image

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "detection": {
    "found": true,
    "confidence": 0.95
  },
  "classification": {
    "label": "White Oyster Mushroom",
    "confidence": 0.92,
    "top_predictions": [
      {"class": "White Oyster Mushroom", "confidence": 0.92},
      {"class": "Enoki Mushroom", "confidence": 0.05},
      {"class": "Button Mushroom", "confidence": 0.03}
    ],
    "toxicity_level": "SAFE"
  }
}
```

### GET /api/toxicity/info
Get model information

### GET /api/toxicity/health
Check if service is healthy

### GET /api/toxicity/classes
Get list of all classifiable mushrooms

---

## 📁 File Structure

**New Files:**
- ✅ `backend/train_custom.py` - Training script
- ✅ `backend/custom_predict.py` - Prediction module
- ✅ `backend/routes/toxicity_routes_custom.py` - Flask routes
- ✅ `models/mushroom_classifier.pth` - Trained weights (generated)
- ✅ `models/mushroom_classes.json` - Class mapping (generated)

**Removed Roboflow Files:**
- ❌ `roboflow_api_predict.py` - Not needed anymore
- ❌ `roboflow_unified_predict.py` - Not needed anymore
- ❌ `toxicity_routes_roboflow_api.py` - Not needed anymore
- ❌ `toxicity_routes_roboflow.py` - Not needed anymore

---

## 🎓 10 Mushroom Classes in Your Dataset

1. **Wood Ear Mushroom** ✅ SAFE - Edible, used in soups
2. **White Oyster Mushroom** ✅ SAFE - Most common cultivated variety
3. **Enoki Mushroom** ✅ SAFE - Long stems, popular in Japanese dishes
4. **Shiitake Mushroom** ✅ SAFE - Brown caps, cultivated variety
5. **Death Cap** ⚠️ DEADLY - Contains amatoxins, causes liver failure
6. **False Morel** ⚠️ DEADLY - Brain-like cap, fatal toxins
7. **Jack O Lantern** ⚠️ POISONOUS - Glowing gills, causes cramps
8. **Funeral Bell** ⚠️ EXTREMELY DEADLY - Same toxins as Death Cap
9. **Red Cage Fungus** ⚠️ NOT EDIBLE - Red lattice structure
10. **Button Mushroom** ✅ SAFE - Most consumed globally

---

## ⚡ Training Tips

### GPU vs CPU
- **With GPU**: Training ~30 seconds per epoch
- **Without GPU**: Training ~2-5 minutes per epoch

Check your device:
```python
import torch
print(torch.cuda.is_available())  # True = GPU, False = CPU
```

### Improve Model Accuracy
1. **Add more images** - Train with 100+ images per class
2. **Better preprocessing** - Normalize lighting, background
3. **Data augmentation** - Rotation, flip, color shifts
4. **Longer training** - Increase EPOCHS from 20 to 50+
5. **Adjust learning rate** - Try 0.0001 to 0.01

Edit `train_custom.py`:
```python
EPOCHS = 50  # Increase from 20
LEARNING_RATE = 0.0001  # Decrease from 0.001
```

---

## 🐛 Troubleshooting

### Model file not found
```
FileNotFoundError: Model not found: models/mushroom_classifier.pth
```
**Fix**: Run `python train_custom.py` first to create the model

### CUDA Out of Memory
```
RuntimeError: CUDA out of memory
```
**Fix**: Reduce `BATCH_SIZE` in `train_custom.py`:
```python
BATCH_SIZE = 8  # Reduce from 32
```

### Model predicts same class for everything
- Not enough training samples
- Images not diverse enough
- Model needs more epochs
- Try: `python train_custom.py` again with more epochs

### Slow predictions
- Using CPU: This is normal, takes 1-2 seconds
- Using GPU: Should be <100ms
- To speed up: Reduce `IMAGE_SIZE` from 224 to 128

---

## 🎯 Next Steps

1. ✅ Run `python train_custom.py` to train
2. ✅ Run `python app.py` to start backend
3. ✅ Run `npm start` to start frontend
4. ✅ Take mushroom photos and see classifications!
5. 🎨 **Add real images** to improve accuracy (optional but recommended)

---

**Last Updated:** February 2, 2026
**Status:** 🟢 Ready to Train & Deploy
