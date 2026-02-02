"""
Setup Helper: Create .env file and validate Roboflow setup
Run this if you need help setting up environment variables.
"""
import os
import sys
from pathlib import Path

def create_env_template():
    """Create a .env template file."""
    backend_dir = Path(__file__).parent / "backend"
    env_file = backend_dir / ".env"
    
    template = """# Roboflow Configuration
ROBOFLOW_API_KEY=your-api-key-here
ROBOFLOW_WORKSPACE=your-workspace-name
ROBOFLOW_DETECTION_PROJECT=your-workspace/mushroom-detection
ROBOFLOW_CLASSIFICATION_PROJECT=your-workspace/mushroom-edibility

# Model Paths
DETECTION_MODEL_PATH=models/detection.pt
CLASSIFICATION_MODEL_PATH=models/classification.pt

# Flask Configuration (Optional)
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# MongoDB (Optional)
DB_URI=mongodb://localhost:27017/snapshroom
"""
    
    if env_file.exists():
        print(f"⚠️  .env already exists at {env_file}")
        response = input("Overwrite? (y/n): ").lower()
        if response != 'y':
            print("❌ Aborted")
            return False
    
    with open(env_file, 'w') as f:
        f.write(template)
    
    print(f"✅ Created .env template at {env_file}")
    print(f"\n📝 Edit the file and add your Roboflow API key:")
    print(f"   1. Go to https://roboflow.com")
    print(f"   2. Settings → API Keys → Copy your private key")
    print(f"   3. Paste it in ROBOFLOW_API_KEY in {env_file}")
    
    return True

def validate_roboflow_setup():
    """Validate Roboflow setup."""
    print("\n" + "="*60)
    print("ROBOFLOW SETUP VALIDATOR")
    print("="*60)
    
    from dotenv import load_dotenv
    backend_dir = Path(__file__).parent / "backend"
    load_dotenv(backend_dir / ".env")
    
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()
    workspace = os.getenv("ROBOFLOW_WORKSPACE", "").strip()
    detection_proj = os.getenv("ROBOFLOW_DETECTION_PROJECT", "").strip()
    classification_proj = os.getenv("ROBOFLOW_CLASSIFICATION_PROJECT", "").strip()
    
    checks = {
        "ROBOFLOW_API_KEY": api_key and api_key != "your-api-key-here",
        "ROBOFLOW_WORKSPACE": workspace and workspace != "your-workspace-name",
        "ROBOFLOW_DETECTION_PROJECT": detection_proj and "mushroom-detection" in detection_proj,
        "ROBOFLOW_CLASSIFICATION_PROJECT": classification_proj and "mushroom-edibility" in classification_proj,
    }
    
    for key, valid in checks.items():
        status = "✅" if valid else "❌"
        print(f"{status} {key}")
    
    if not all(checks.values()):
        print("\n⚠️  Some settings are missing. Edit backend/.env and try again.")
        return False
    
    print("\n✅ All Roboflow settings configured correctly!")
    return True

def install_dependencies():
    """Offer to install dependencies."""
    print("\n" + "="*60)
    print("INSTALL DEPENDENCIES")
    print("="*60)
    
    requirements = [
        "roboflow==1.1.11",
        "ultralytics==8.0.205",
        "torch==2.1.0",
        "torchvision==0.25.0",
        "pillow==12.1.0",
        "requests==2.32.5",
        "python-dotenv==1.2.1",
    ]
    
    print("Required packages:")
    for req in requirements:
        print(f"  - {req}")
    
    response = input("\nInstall now? (y/n): ").lower()
    if response == 'y':
        print("\n📦 Installing dependencies...")
        backend_dir = Path(__file__).parent / "backend"
        req_file = backend_dir / "roboflow_requirements.txt"
        
        os.system(f"pip install -r {req_file}")
        print("\n✅ Dependencies installed!")
        return True
    
    return False

def download_test_models():
    """Helper to download test models."""
    print("\n" + "="*60)
    print("MODEL SETUP")
    print("="*60)
    
    backend_dir = Path(__file__).parent / "backend"
    models_dir = backend_dir / "models"
    models_dir.mkdir(exist_ok=True)
    
    detection_model = models_dir / "detection.pt"
    classification_model = models_dir / "classification.pt"
    
    if detection_model.exists() and classification_model.exists():
        print("✅ Both models found!")
        print(f"  - Detection: {detection_model}")
        print(f"  - Classification: {classification_model}")
        return True
    
    print("❌ Models not found. You need to:")
    print("\n1. Train on Roboflow:")
    print("   - Go to https://roboflow.com")
    print("   - Create 'mushroom-detection' project")
    print("   - Create 'mushroom-edibility' project")
    print("   - Train both models")
    
    print("\n2. Export as PyTorch:")
    print("   - Click Versions → Latest")
    print("   - Click Export → PyTorch")
    print(f"   - Save to: {models_dir}/")
    
    print(f"\n3. Verify:")
    print(f"   - {detection_model}")
    print(f"   - {classification_model}")
    
    return False

def main():
    """Run setup wizard."""
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║          ROBOFLOW SETUP WIZARD                             ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print("\nThis wizard will help you set up Roboflow integration.")
    
    # Step 1: Create .env
    print("\n[Step 1/4] Create environment file")
    print("-" * 60)
    if not create_env_template():
        return 1
    
    # Step 2: Validate config
    print("\n[Step 2/4] Validate configuration")
    print("-" * 60)
    input("Press Enter after editing backend/.env with your Roboflow API key...")
    
    if not validate_roboflow_setup():
        print("\n❌ Configuration incomplete. Edit backend/.env and run again.")
        return 1
    
    # Step 3: Install dependencies
    print("\n[Step 3/4] Install dependencies")
    print("-" * 60)
    install_dependencies()
    
    # Step 4: Check models
    print("\n[Step 4/4] Verify models")
    print("-" * 60)
    download_test_models()
    
    # Final message
    print("\n" + "="*60)
    print("SETUP COMPLETE!")
    print("="*60)
    
    print("\n📋 Next steps:")
    print("1. Train detection model on Roboflow (mushroom-detection)")
    print("2. Train classification model on Roboflow (mushroom-edibility)")
    print("3. Export both as PyTorch to backend/models/")
    print("4. Run: python test_roboflow_setup.py")
    print("5. Start Flask app: python backend/app.py")
    
    print("\n📚 Documentation:")
    print("- ROBOFLOW_UNIFIED_SETUP.md - Full setup guide")
    print("- ROBOFLOW_READY.md - Quick reference")
    print("- OLD_FILES_ARCHIVAL.md - What to delete")
    
    print("\n🎉 You're ready to go!")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
