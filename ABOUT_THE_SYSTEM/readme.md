
### Step 1: Prepare Your Dataset
**What happens:**
- 📊 Loads all images from dataset
- 🧠 Trains ResNet50 for 20 epochs
- 💾 Saves model to `models/mushroom_classifier.pth`
- 📝 Saves classes to `models/mushroom_classes.json`

---
**Output:**
- ✅ `models/mushroom_classifier.pth` - Trained model weights
- ✅ `models/mushroom_classes.json` - Class names and mappings

**update the model?**
- Put new images in `datasets/mushroom_dataset/`
- Run `python train_custom.py` again
- Old model is replaced with new one


### Training the Detector (Binary Model)
This trains the model to recognize "mushroom vs not mushroom":

- Run `python train_mushroom_detector.py`

## What train_custom.py Does

1. **Loads Data** - Reads from CSV and image files
2. **Splits** - 80% training, 20% validation
3. **Uses ResNet50** - Pre-trained deep learning model
4. **Trains** - Updates model weights based on your data
5. **Saves** - Best model from all epochs
6. **Outputs** - Model file + class mapping
