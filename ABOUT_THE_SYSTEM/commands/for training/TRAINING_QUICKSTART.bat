@echo off
REM Quick Start Script for Mushroom Model Training
REM ================================================
REM This script helps you train both detection and classification models

echo.
echo ========================================
echo   Mushroom Model Training Quick Start
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Checking Python installation...
python --version

REM Check if virtual environment exists
if not exist "venv" (
    echo.
    echo [2/4] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully!
) else (
    echo.
    echo [2/4] Virtual environment already exists
)

REM Activate virtual environment
echo.
echo [3/4] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo.
echo [4/4] Installing requirements...
echo This may take several minutes...
pip install -r requirements.txt --upgrade

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo You can now train the models:
echo.
echo   1. Train Detection Model (YOLOv8):
echo      python train_detection.py
echo.
echo   2. Train Classification Model (ResNet50):
echo      python train_classification.py
echo.
echo   3. Test Prediction System:
echo      python predict.py
echo.
echo For detailed instructions, see TRAINING_GUIDE.md
echo.
pause
