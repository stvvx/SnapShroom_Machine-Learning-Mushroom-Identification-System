#!/usr/bin/env python
"""
Quick Start Script - Setup and Train Custom Mushroom Classifier
Run this to get started immediately!
"""

import os
import sys
import subprocess
import json

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def check_python():
    """Verify Python version"""
    print_header("1️⃣  CHECKING PYTHON")
    version = sys.version_info
    print(f"Python {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print("✅ Python version OK")
    return True

def install_dependencies():
    """Install required packages"""
    print_header("2️⃣  INSTALLING DEPENDENCIES")
    
    packages = [
        "torch",
        "torchvision",
        "pillow",
        "pandas",
        "scikit-learn",
        "opencv-python",
        "tqdm"
    ]
    
    print("Installing required packages...")
    for package in packages:
        print(f"  📦 {package}...", end=" ", flush=True)
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", package],
            capture_output=True
        )
        if result.returncode == 0:
            print("✅")
        else:
            print("⚠️ (may already be installed)")
    
    print("\n✅ Dependencies installed")

def check_dataset():
    """Check if dataset exists"""
    print_header("3️⃣  CHECKING DATASET")
    
    csv_path = "mushrooms10kinds.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ {csv_path} not found!")
        print(f"   Please ensure {csv_path} is in the backend directory")
        return False
    
    print(f"✅ Found {csv_path}")
    
    # Check CSV content
    try:
        import pandas as pd
        df = pd.read_csv(csv_path)
        print(f"   📊 Samples: {len(df)}")
        print(f"   🏷️  Mushroom types: {len(df['english_name'].unique())}")
        print(f"   Types: {', '.join(df['english_name'].unique()[:3])}...")
    except Exception as e:
        print(f"⚠️ Could not read CSV: {e}")
    
    return True

def train_model():
    """Train the custom model"""
    print_header("4️⃣  TRAINING MODEL")
    
    print("This will train a ResNet50 model on your dataset...")
    print("(You can add real images to datasets/mushroom_dataset/ to improve accuracy)\n")
    
    result = subprocess.run(
        [sys.executable, "train_custom.py"],
        capture_output=False
    )
    
    if result.returncode == 0:
        print("\n✅ Training completed!")
        
        # Check outputs
        if os.path.exists("models/mushroom_classifier.pth"):
            print("   ✅ Model saved: models/mushroom_classifier.pth")
        if os.path.exists("models/mushroom_classes.json"):
            print("   ✅ Classes saved: models/mushroom_classes.json")
        
        return True
    else:
        print("❌ Training failed")
        return False

def test_model():
    """Test if model loads correctly"""
    print_header("5️⃣  TESTING MODEL")
    
    try:
        from custom_predict import create_predictor
        predictor = create_predictor()
        
        print(f"✅ Model loaded successfully")
        print(f"   Classes: {len(predictor.classes)}")
        print(f"   Mushroom types: {', '.join(predictor.classes[:3])}...")
        print(f"   Device: {predictor.device}")
        
        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def show_next_steps():
    """Show next steps"""
    print_header("✅ SETUP COMPLETE!")
    
    print("""
🚀 NEXT STEPS:

1. Start Backend Server:
   python app.py

2. Start Frontend (in new terminal):
   npm start

3. Test the API:
   curl http://localhost:5000/api/toxicity/info

4. Take Photos!
   - Open the app
   - Go to Camera
   - Take a mushroom photo
   - See the classification!

📚 For more info:
   - Read CUSTOM_MODEL_SETUP.md
   - Check models/mushroom_classes.json for all classes
   - Update train_custom.py to use real images

⚠️  IMPORTANT:
   - The model uses placeholder images for now
   - Add real mushroom images to datasets/mushroom_dataset/
   - Re-run python train_custom.py to improve accuracy

Questions? Check the documentation files!
    """)

def main():
    """Run setup"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("""
╔════════════════════════════════════════════════════════╗
║   🍄 SNAPSHROOM - CUSTOM MODEL SETUP                  ║
║   Using your mushroom10kinds dataset                  ║
╚════════════════════════════════════════════════════════╝
    """)
    
    # Run checks
    if not check_python():
        return False
    
    install_dependencies()
    
    if not check_dataset():
        return False
    
    if not train_model():
        return False
    
    if not test_model():
        return False
    
    show_next_steps()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
