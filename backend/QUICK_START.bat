@echo off
REM SnapShroom Custom Model - Quick Start (Windows)
REM Run this batch file to train and deploy!

echo.
echo ════════════════════════════════════════════════════════
echo    🍄 SNAPSHROOM - CUSTOM MODEL QUICK START (Windows)
echo ════════════════════════════════════════════════════════
echo.

REM Check if we're in the right directory
if not exist "app.py" (
    echo ❌ Error: app.py not found
    echo Please run this from the backend directory
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
python -m pip install -q torch torchvision pillow pandas scikit-learn opencv-python tqdm
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Step 2: Train model
echo.
echo 🤖 Training custom mushroom classifier...
echo    (This may take 1-5 minutes depending on your GPU)
echo.
python train_custom.py
if %errorlevel% neq 0 (
    echo ❌ Training failed
    pause
    exit /b 1
)

REM Step 3: Verify model
echo.
echo ✅ Verifying model...
python -c "from custom_predict import create_predictor; p = create_predictor(); print(f'✅ Model ready! Classes: {len(p.classes)}')"
if %errorlevel% neq 0 (
    echo ❌ Model verification failed
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════
echo    ✅ MODEL TRAINING COMPLETE!
echo ════════════════════════════════════════════════════════
echo.
echo 📝 NEXT STEPS:
echo.
echo 1. Start Backend Server (this terminal):
echo    python app.py
echo.
echo 2. Start Frontend (in new terminal):
echo    cd frontend
echo    npm start
echo.
echo 3. Test Camera:
echo    - Open app
echo    - Go to Camera
echo    - Take mushroom photo
echo    - See classification!
echo.
echo 🎓 For more info, read: ..\CUSTOM_MODEL_SETUP.md
echo.
pause
