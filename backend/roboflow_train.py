"""
Train and export YOLOv8 detection/classification models using Roboflow.
"""
import os
import sys
from roboflow import Roboflow
import yaml

def train_roboflow_model(
    api_key: str,
    project_url: str,
    model_type: str = "yolov8",
    task: str = "detect",  # 'detect' or 'classify'
    epochs: int = 100
):
    """
    Train a model using Roboflow.
    
    Args:
        api_key: Your Roboflow API key
        project_url: Project URL (e.g., 'mushroom-detection/1')
        model_type: Type of model ('yolov8', 'yolov5', etc.)
        task: Training task ('detect' or 'classify')
        epochs: Number of training epochs
    """
    print(f"=== Training {model_type} for {task} ===")
    
    # Initialize Roboflow
    rf = Roboflow(api_key=api_key)
    project = rf.workspace().project(project_url)
    
    # Download dataset
    print("Downloading dataset from Roboflow...")
    dataset = project.version(1).download(model_type)
    
    # Train model using Roboflow
    print(f"Training {model_type} model on Roboflow...")
    model = project.train(
        model_type=model_type,
        task=task,
        epochs=epochs
    )
    
    print("Training complete!")
    return model


def export_roboflow_model(
    api_key: str,
    project_url: str,
    version_id: int,
    export_format: str = "pytorch",  # 'pytorch', 'onnx', 'tensorflow', etc.
    output_dir: str = "models"
):
    """
    Export trained model from Roboflow.
    
    Args:
        api_key: Your Roboflow API key
        project_url: Project URL
        version_id: Model version ID
        export_format: Export format
        output_dir: Output directory for model
    """
    print(f"=== Exporting Roboflow Model ===")
    
    rf = Roboflow(api_key=api_key)
    project = rf.workspace().project(project_url)
    version = project.version(version_id)
    
    print(f"Exporting as {export_format}...")
    model = version.model
    export_path = model.export(
        export_format=export_format,
        confidence=0.5,
        iou=0.45
    )
    
    print(f"Model exported to: {export_path}")
    return export_path


def download_roboflow_dataset(
    api_key: str,
    project_url: str,
    version_id: int = 1,
    model_type: str = "yolov8",
    output_dir: str = "dataset"
):
    """
    Download dataset from Roboflow.
    
    Args:
        api_key: Your Roboflow API key
        project_url: Project URL
        version_id: Dataset version ID
        model_type: Model type for dataset format
        output_dir: Output directory for dataset
    """
    print(f"=== Downloading Roboflow Dataset ===")
    
    rf = Roboflow(api_key=api_key)
    project = rf.workspace().project(project_url)
    dataset = project.version(version_id).download(
        model_type=model_type,
        location=output_dir
    )
    
    print(f"Dataset downloaded to: {output_dir}")
    return dataset


if __name__ == "__main__":
    # Set your Roboflow API key
    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "your-api-key-here")
    
    # Your Roboflow project URL (format: workspace/project/version)
    ROBOFLOW_PROJECT = "your-workspace/mushroom-detection/1"
    
    # Download dataset
    # download_roboflow_dataset(
    #     api_key=ROBOFLOW_API_KEY,
    #     project_url=ROBOFLOW_PROJECT,
    #     model_type="yolov8",
    #     output_dir="roboflow_dataset"
    # )
    
    # Train model
    # train_roboflow_model(
    #     api_key=ROBOFLOW_API_KEY,
    #     project_url=ROBOFLOW_PROJECT,
    #     model_type="yolov8",
    #     task="detect",
    #     epochs=100
    # )
    
    # Export model
    # export_roboflow_model(
    #     api_key=ROBOFLOW_API_KEY,
    #     project_url=ROBOFLOW_PROJECT,
    #     version_id=1,
    #     export_format="pytorch",
    #     output_dir="models"
    # )
