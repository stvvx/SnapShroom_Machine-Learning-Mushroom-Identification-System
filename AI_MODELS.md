# AI Models in SnapShroom

## Overview

Your SnapShroom system uses **two AI models** for mushroom identification:

1. **Toxicity Detection Model** (Deep Learning - PyTorch)
2. **Species Classification Model** (Machine Learning - scikit-learn)

---

## 1. Toxicity Detection Model

### Architecture
- **Model**: MobileNetV2 (Convolutional Neural Network)
- **Framework**: PyTorch
- **Task**: Binary Classification (Edible vs Poisonous)
- **Input**: 224x224 RGB images
- **Output**: 2 classes (poisonous=0, edible=1)

### Model Details
```python
# Architecture
MobileNetV2 (base)
  └─ Classifier: Linear(1280 → 2)
```

### Training
- **Loss Function**: CrossEntropyLoss
- **Optimizer**: Adam (learning rate: 0.0001)
- **Scheduler**: StepLR (reduces LR every 7 epochs)
- **Epochs**: 20 (configurable)
- **Batch Size**: 32

### Saved Model
- **File**: `models/mushroom_edibility.pth`
- **Format**: PyTorch state dictionary
- **Size**: ~9-14 MB

### Current Status
- ✅ Model architecture defined
- ✅ Training script ready
- ⚠️ **Model needs to be trained** with your dataset

---

## 2. Species Classification Model

### Architecture
- **Model**: Random Forest Classifier
- **Framework**: scikit-learn
- **Task**: Multi-class Classification (14 mushroom species)
- **Input**: Flattened image pixels (224×224×3 = 150,528 features)
- **Output**: 14 classes (one per species)

### Model Details
```python
# Architecture
RandomForestClassifier(
    n_estimators=100,
    random_state=42
)
```

### Feature Extraction
- Simple pixel-based features
- Image resized to 224×224
- Flattened to 1D vector
- Normalized to [0, 1]

### Training
- **Algorithm**: Random Forest (ensemble of decision trees)
- **Trees**: 100 estimators
- **Features**: 150,528 per image (pixel values)

### Saved Model
- **File**: `models/species_model.pkl`
- **Format**: Pickle (includes model + label encoder)
- **Size**: Varies based on dataset

### Current Status
- ✅ Model architecture defined
- ✅ Training script ready
- ⚠️ **Model needs to be trained** with your dataset

---

## Model Training

### To Train the Models:

```bash
cd SnapShroom/backend

# Train both models
python train.py --epochs 20

# Or train with custom parameters
python train.py --epochs 30 --batch_size 16 --lr 0.0001
```

### Training Process:

1. **Toxicity Model** (PyTorch):
   - Loads images from `dataset/train/edible/` and `dataset/train/poisonous/`
   - Trains MobileNetV2 for binary classification
   - Saves best model based on validation accuracy
   - Output: `models/mushroom_edibility.pth`

2. **Species Model** (scikit-learn):
   - Loads images from all species subdirectories
   - Extracts pixel features
   - Trains Random Forest classifier
   - Saves model with label encoder
   - Output: `models/species_model.pkl`

---

## Model Performance

### Expected Performance (with good dataset):

**Toxicity Detection:**
- Accuracy: 70-90% (depends on dataset quality)
- Binary classification is easier than species identification

**Species Classification:**
- Accuracy: 50-80% (depends on dataset size and image quality)
- 14 classes with limited training data per species

### Limitations:

1. **Small Dataset**: 
   - Only ~62 training images total
   - ~4-5 images per species on average
   - Deep learning models typically need 100+ images per class

2. **Simple Features**:
   - Species model uses raw pixels (not optimal)
   - No transfer learning for species classification
   - Could benefit from CNN features

3. **No Pretrained Weights**:
   - MobileNetV2 starts from scratch
   - Could use ImageNet pretrained weights for better performance

---

## Improving Model Performance

### Option 1: Use Pretrained Weights (Recommended)

Update `train.py` to use ImageNet pretrained weights:

```python
# Instead of:
model = models.mobilenet_v2(weights=None)

# Use:
model = models.mobilenet_v2(weights='IMAGENET1K_V1')  # Pretrained!
```

This will significantly improve accuracy with limited data!

### Option 2: Better Feature Extraction for Species

Use CNN features instead of raw pixels:

```python
# Extract features using pretrained CNN
feature_extractor = models.mobilenet_v2(pretrained=True)
# Remove classifier, use as feature extractor
# Then train Random Forest on CNN features
```

### Option 3: More Training Data

- Collect more images per species (aim for 50+ per class)
- Use data augmentation (rotation, flipping, color jitter)
- Consider using online mushroom image datasets

### Option 4: Transfer Learning for Species

Train a CNN for species classification using transfer learning:

```python
# Use pretrained MobileNetV2
# Replace classifier: Linear(1280, 14)  # 14 species
# Fine-tune on your dataset
```

---

## Current Model Files

Check if models exist:
```bash
ls backend/models/
```

Should see:
- `mushroom_edibility.pth` - PyTorch toxicity model
- `species_model.pkl` - scikit-learn species model

If missing, run training:
```bash
python train.py
```

---

## Model Usage in Production

### Toxicity Detection:
```python
# Loads: models/mushroom_edibility.pth
# Uses: MobileNetV2 CNN
# Input: PIL Image
# Output: {"edible": bool, "poisonous": bool, "confidence": float}
```

### Species Classification:
```python
# Loads: models/species_model.pkl
# Uses: Random Forest
# Input: PIL Image (converted to pixel features)
# Output: {"species": str, "confidence": float, "metadata": dict}
```

---

## Summary

**Yes, your system uses AI models:**

1. ✅ **Deep Learning Model** (PyTorch/MobileNetV2) - Toxicity detection
2. ✅ **Machine Learning Model** (scikit-learn/Random Forest) - Species classification

**Current Status:**
- Model architectures: ✅ Implemented
- Training scripts: ✅ Ready
- Trained models: ⚠️ Need to train with your dataset

**To get started:**
```bash
cd SnapShroom/backend
python train.py --epochs 20
```

This will train both models using your dataset images!

---

**Note**: For production use, consider:
- Using pretrained weights for better accuracy
- Collecting more training images
- Implementing data augmentation
- Using CNN features for species classification