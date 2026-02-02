#!/bin/bash
# SnapShroom Custom Model - Quick Start Script
# Run this file to train and deploy in seconds!

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🍄 SNAPSHROOM - CUSTOM MODEL QUICK START            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Navigate to backend
echo "📂 Moving to backend directory..."
cd backend

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -q torch torchvision pillow pandas scikit-learn opencv-python tqdm

# Step 3: Train model
echo ""
echo "🤖 Training custom mushroom classifier..."
echo "   (This may take 1-5 minutes depending on your GPU)"
python train_custom.py

# Step 4: Verify model
echo ""
echo "✅ Verifying model..."
python -c "from custom_predict import create_predictor; p = create_predictor(); print(f'✅ Model ready! Classes: {len(p.classes)}')"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✅ MODEL TRAINING COMPLETE!                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Start Backend Server:"
echo "   python app.py"
echo ""
echo "2. Start Frontend (in new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "3. Test Camera:"
echo "   - Open app"
echo "   - Go to Camera"
echo "   - Take mushroom photo"
echo "   - See classification!"
echo ""
echo "🎓 For more info, read: ../CUSTOM_MODEL_SETUP.md"
echo ""
