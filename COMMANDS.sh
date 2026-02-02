#!/usr/bin/env bash
# SnapShroom Custom Model - Command Reference
# Copy-paste these commands to run your app

# ═══════════════════════════════════════════════════════
# STEP 1: TRAIN THE MODEL
# ═══════════════════════════════════════════════════════

cd backend
python train_custom.py

# Expected output:
# 🖥️ Using device: cuda (or cpu)
# 📊 Total samples: 10
# 🏷️  Classes: 10 mushroom types
# --- Epoch 1/20 ---
# ✅ Model saved to models/mushroom_classifier.pth
# ✅ Classes saved to models/mushroom_classes.json


# ═══════════════════════════════════════════════════════
# STEP 2: START BACKEND SERVER
# ═══════════════════════════════════════════════════════

python app.py

# Expected output:
# ✅ Custom Mushroom Predictor initialized
# ✅ Toxicity/Detection routes loaded (Custom Model)
# ✅ SnapShroom API initialized
#  * Running on http://127.0.0.1:5000


# ═══════════════════════════════════════════════════════
# STEP 3: START FRONTEND (in new terminal)
# ═══════════════════════════════════════════════════════

cd frontend
npm start

# Expected output:
# > exp start
# Expo running on localhost:8081


# ═══════════════════════════════════════════════════════
# TESTING COMMANDS
# ═══════════════════════════════════════════════════════

# Test 1: Check if backend is healthy
curl http://localhost:5000/api/toxicity/health

# Test 2: Get model information
curl http://localhost:5000/api/toxicity/info

# Test 3: Get all mushroom classes
curl http://localhost:5000/api/toxicity/classes

# Test 4: Make a prediction (example with base64 image)
curl -X POST http://localhost:5000/api/toxicity/predict \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "data:image/jpeg;base64,..."}'


# ═══════════════════════════════════════════════════════
# QUICK SETUP (One-Liner)
# ═══════════════════════════════════════════════════════

# Windows users:
cd backend && python train_custom.py && python app.py

# Then in another terminal:
cd frontend && npm start


# ═══════════════════════════════════════════════════════
# ADVANCED: RETRAINING WITH REAL IMAGES
# ═══════════════════════════════════════════════════════

# 1. Add images to:
# backend/datasets/mushroom_dataset/mushroom_name/images.jpg

# 2. Update train_custom.py line ~60 to load real images

# 3. Retrain:
cd backend
python train_custom.py

# 4. Restart backend:
python app.py


# ═══════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════

# View model info
python -c "from custom_predict import create_predictor; p = create_predictor(); print(f'Classes: {p.classes}')"

# Check if GPU available
python -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}')"

# View trained model size
ls -lh models/mushroom_classifier.pth

# Check all dependencies installed
pip list | grep -E "torch|opencv|pandas"


# ═══════════════════════════════════════════════════════
# DOCKER DEPLOYMENT (Optional)
# ═══════════════════════════════════════════════════════

# Build image
docker build -t snapshroom .

# Run container
docker run -p 5000:5000 snapshroom


# ═══════════════════════════════════════════════════════
# MONITORING
# ═══════════════════════════════════════════════════════

# Watch logs
tail -f logs/*.log

# Monitor GPU usage
nvidia-smi -l 1  # Updates every second

# Check Python memory usage
python -c "import psutil; print(f'Memory: {psutil.virtual_memory().percent}%')"


# ═══════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════

# Model file missing?
python train_custom.py

# Backend won't start?
pip install -r requirements.txt
python app.py

# Frontend error?
cd frontend
npm install
npm start

# Port already in use?
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>


# ═══════════════════════════════════════════════════════
# USEFUL LINKS
# ═══════════════════════════════════════════════════════

# API Health: http://localhost:5000/api/toxicity/health
# Expo App: http://localhost:8081
# MongoDB: mongodb+srv://...@cluster0.y6s4vtq.mongodb.net
# Ngrok: https://eastwardly-retreatal-kerstin.ngrok-free.dev


# ═══════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════

# Quick start:
cd backend && python train_custom.py && python app.py
# Then: cd frontend && npm start

# Done! 🍄✨
