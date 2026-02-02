"""
Unified Roboflow Training Script for Mushroom Detection + Classification
Trains both detection (YOLOv8) and classification models on Roboflow.
"""
import os
from roboflow import Roboflow
from dotenv import load_dotenv

load_dotenv()

class RoboflowUnifiedTrainer:
    """
    Train detection and classification models using Roboflow.
    """
    
    def __init__(self, api_key: str, workspace: str):
        """
        Initialize trainer.
        
        Args:
            api_key: Roboflow API key
            workspace: Roboflow workspace name
        """
        self.api_key = api_key
        self.workspace = workspace
        self.rf = Roboflow(api_key=api_key)
    
    def train_detection_model(
        self,
        project_name: str,
        version: int = 1,
        model_type: str = "yolov8",
        epochs: int = 100
    ):
        """
        Train YOLOv8 detection model (finds and locates mushrooms).
        
        Args:
            project_name: Detection project name on Roboflow
            version: Dataset version
            model_type: Model type (yolov8, yolov5, etc.)
            epochs: Training epochs
        """
        print("=" * 60)
        print("TRAINING DETECTION MODEL (YOLOv8)")
        print("=" * 60)
        
        project = self.rf.workspace().project(project_name)
        version_obj = project.version(version)
        
        # Download dataset
        print(f"\n📥 Downloading detection dataset...")
        dataset = version_obj.download(model_type=model_type)
        print(f"✅ Dataset downloaded to: {dataset.location}")
        
        # Train via Roboflow (recommended) or locally
        print(f"\n🚀 Training {model_type} detection model...")
        print("   Go to: https://roboflow.com → Your Project → Train")
        print(f"   Or use: roboflow.train(model_type='{model_type}')")
        
        return dataset
    
    def train_classification_model(
        self,
        project_name: str,
        version: int = 1,
        model_type: str = "yolov8",
        epochs: int = 100
    ):
        """
        Train YOLOv8 classification model (classifies mushroom edibility).
        
        Args:
            project_name: Classification project name on Roboflow
            version: Dataset version
            model_type: Model type (yolov8, yolov5, etc.)
            epochs: Training epochs
        """
        print("\n" + "=" * 60)
        print("TRAINING CLASSIFICATION MODEL (Edible vs Poisonous)")
        print("=" * 60)
        
        project = self.rf.workspace().project(project_name)
        version_obj = project.version(version)
        
        # Download dataset
        print(f"\n📥 Downloading classification dataset...")
        dataset = version_obj.download(model_type=model_type, task="classification")
        print(f"✅ Dataset downloaded to: {dataset.location}")
        
        print(f"\n🚀 Training {model_type} classification model...")
        print("   Go to: https://roboflow.com → Your Project → Train")
        
        return dataset
    
    def export_model(
        self,
        project_name: str,
        version: int = 1,
        export_format: str = "pytorch",
        model_type: str = "yolov8",
        output_dir: str = "models"
    ):
        """
        Export trained model from Roboflow.
        
        Args:
            project_name: Project name
            version: Trained model version
            export_format: pytorch, onnx, tensorflow, etc.
            model_type: yolov8, yolov5, etc.
            output_dir: Where to save model
        """
        print(f"\n💾 Exporting {export_format} model...")
        
        project = self.rf.workspace().project(project_name)
        version_obj = project.version(version)
        
        # Get model
        model = version_obj.model
        
        # Export
        download_path = model.export(
            export_format=export_format,
            confidence=0.5,
            iou=0.45
        )
        
        print(f"✅ Model exported to: {download_path}")
        return download_path


def setup_roboflow_projects():
    """
    Quick setup guide for Roboflow projects.
    """
    print("""
╔════════════════════════════════════════════════════════════════╗
║           ROBOFLOW PROJECT SETUP GUIDE                         ║
╚════════════════════════════════════════════════════════════════╝

You need 2 Roboflow Projects:

1️⃣  DETECTION PROJECT (e.g., "mushroom-detection")
   ├─ Purpose: Locate mushrooms in images (YOLOv8)
   ├─ Dataset: Images with mushroom bounding boxes
   ├─ Export: Detection format
   └─ Output: Locates position of mushrooms

2️⃣  CLASSIFICATION PROJECT (e.g., "mushroom-edibility")
   ├─ Purpose: Classify as EDIBLE or POISONOUS
   ├─ Dataset: Cropped mushroom images with labels
   ├─ Export: Classification format
   └─ Output: Edibility prediction

STEPS:
1. Visit https://roboflow.com
2. Create "mushroom-detection" project
   - Upload images with bounding boxes
   - Train YOLOv8 detection model
   - Export as PyTorch (.pt)
   
3. Create "mushroom-edibility" project
   - Upload edible/poisonous mushroom images
   - Train YOLOv8 classification model
   - Export as PyTorch (.pt)

4. Set environment variables in .env:
   ROBOFLOW_API_KEY=your-api-key
   ROBOFLOW_DETECTION_PROJECT=your-workspace/mushroom-detection
   ROBOFLOW_CLASSIFICATION_PROJECT=your-workspace/mushroom-edibility
   
5. Export both models and place in backend/models/

EXPECTED FILE STRUCTURE:
models/
├── detection.pt          (YOLOv8 detection model)
├── classification.pt     (YOLOv8 classification model)
└── data.yaml             (class names)
    """)


if __name__ == "__main__":
    api_key = os.getenv("ROBOFLOW_API_KEY")
    workspace = os.getenv("ROBOFLOW_WORKSPACE", "your-workspace")
    
    if not api_key:
        print("❌ ROBOFLOW_API_KEY not set. Add to .env file.")
        setup_roboflow_projects()
        exit(1)
    
    trainer = RoboflowUnifiedTrainer(api_key, workspace)
    
    # Example usage (uncomment to use):
    # trainer.train_detection_model("mushroom-detection")
    # trainer.train_classification_model("mushroom-edibility")
    # trainer.export_model("mushroom-detection", export_format="pytorch", output_dir="models")
    # trainer.export_model("mushroom-edibility", export_format="pytorch", output_dir="models")
