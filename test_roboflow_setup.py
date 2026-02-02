"""
Quick Start: Test Roboflow Unified System
Run this to verify everything is working.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

load_dotenv(backend_dir / ".env")

def test_environment():
    """Check if environment is properly set up."""
    print("\n" + "="*60)
    print("ENVIRONMENT CHECK")
    print("="*60)
    
    checks = {
        "ROBOFLOW_API_KEY": os.getenv("ROBOFLOW_API_KEY"),
        "DETECTION_MODEL_PATH": os.getenv("DETECTION_MODEL_PATH", "models/detection.pt"),
        "CLASSIFICATION_MODEL_PATH": os.getenv("CLASSIFICATION_MODEL_PATH", "models/classification.pt"),
    }
    
    for key, value in checks.items():
        status = "✅" if value else "❌"
        print(f"{status} {key}: {value if value else 'NOT SET'}")
    
    return all(checks.values())

def test_models():
    """Check if model files exist."""
    print("\n" + "="*60)
    print("MODEL FILES CHECK")
    print("="*60)
    
    detection = os.getenv("DETECTION_MODEL_PATH", "backend/models/detection.pt")
    classification = os.getenv("CLASSIFICATION_MODEL_PATH", "backend/models/classification.pt")
    
    def_exists = os.path.exists(detection)
    class_exists = os.path.exists(classification)
    
    print(f"{'✅' if def_exists else '❌'} Detection model: {detection}")
    if not def_exists:
        print(f"   → Export from Roboflow and place here")
    
    print(f"{'✅' if class_exists else '❌'} Classification model: {classification}")
    if not class_exists:
        print(f"   → Export from Roboflow and place here")
    
    return def_exists and class_exists

def test_imports():
    """Check if required packages are installed."""
    print("\n" + "="*60)
    print("DEPENDENCIES CHECK")
    print("="*60)
    
    packages = {
        "torch": "PyTorch",
        "ultralytics": "YOLOv8",
        "PIL": "Pillow",
        "roboflow": "Roboflow SDK",
        "flask": "Flask",
    }
    
    all_ok = True
    for package, name in packages.items():
        try:
            __import__(package)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - Install with: pip install {package}")
            all_ok = False
    
    return all_ok

def test_predictor():
    """Test if predictor can be instantiated."""
    print("\n" + "="*60)
    print("PREDICTOR TEST")
    print("="*60)
    
    try:
        from roboflow_unified_predict import RoboflowUnifiedPredictor
        
        detection = os.getenv("DETECTION_MODEL_PATH", "backend/models/detection.pt")
        classification = os.getenv("CLASSIFICATION_MODEL_PATH", "backend/models/classification.pt")
        
        print("Loading models...")
        predictor = RoboflowUnifiedPredictor(detection, classification)
        print("✅ Predictor loaded successfully!")
        
        # Try a dummy prediction (will fail if no image)
        print("\n🎯 Ready for predictions!")
        print("   Usage: result = predictor.predict('image.jpg')")
        
        return True
    except FileNotFoundError as e:
        print(f"❌ Models not found: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_flask_route():
    """Test Flask integration."""
    print("\n" + "="*60)
    print("FLASK ROUTES CHECK")
    print("="*60)
    
    try:
        sys.path.insert(0, str(backend_dir))
        from routes.toxicity_routes_roboflow import toxicity_bp
        print("✅ Flask routes imported successfully!")
        print("   - /api/toxicity/predict")
        print("   - /api/toxicity/detect-and-classify")
        print("   - /api/toxicity/health")
        return True
    except Exception as e:
        print(f"❌ Error importing routes: {e}")
        return False

def main():
    """Run all tests."""
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║        ROBOFLOW UNIFIED SYSTEM - STARTUP CHECK             ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    results = {
        "Environment": test_environment(),
        "Models": test_models(),
        "Dependencies": test_imports(),
        "Predictor": test_predictor(),
        "Flask Routes": test_flask_route(),
    }
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All checks passed! Ready to deploy.")
        print("\nStart your Flask app with:")
        print("  python backend/app.py")
        print("\nTest the API:")
        print("  curl -X POST -F 'image=@mushroom.jpg' http://localhost:5000/api/toxicity/predict")
        return 0
    else:
        print("\n⚠️  Some checks failed. See details above.")
        print("\nNext steps:")
        
        if not results["Models"]:
            print("  1. Train and export models from Roboflow")
            print("  2. Place in backend/models/")
        
        if not results["Dependencies"]:
            print("  3. Install missing dependencies:")
            print("     pip install -r backend/roboflow_requirements.txt")
        
        if not results["Environment"]:
            print("  4. Update backend/.env with Roboflow credentials")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
