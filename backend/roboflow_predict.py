"""
Inference using Roboflow-trained models.
"""
import os
from PIL import Image
import requests
import json
from typing import Dict, List, Any

class RoboflowPredictor:
    """
    Predict using Roboflow API or exported models.
    """
    
    def __init__(self, api_key: str, project_url: str, model_version: int = 1):
        """
        Initialize Roboflow predictor.
        
        Args:
            api_key: Roboflow API key
            project_url: Project URL (workspace/project)
            model_version: Model version number
        """
        self.api_key = api_key
        self.project_url = project_url
        self.model_version = model_version
        self.base_url = "https://detect.roboflow.com"
        
    def predict_api(self, image_path: str, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Make prediction using Roboflow API (requires internet).
        
        Args:
            image_path: Path to image file
            confidence: Confidence threshold
            
        Returns:
            Prediction results with detections
        """
        with open(image_path, "rb") as image_file:
            r = requests.post(
                f"{self.base_url}/{self.project_url}",
                params={"api_key": self.api_key, "confidence": confidence},
                files={"imageToUpload": image_file}
            )
        
        return r.json()
    
    def predict_image(self, image_path: str) -> Dict[str, Any]:
        """
        Predict mushroom edibility from image.
        
        Args:
            image_path: Path to mushroom image
            
        Returns:
            Dictionary with predictions
        """
        result = self.predict_api(image_path)
        
        if "predictions" in result and result["predictions"]:
            predictions = result["predictions"]
            
            # Extract mushroom detections
            mushrooms = [p for p in predictions if p.get("class") in ["edible", "poisonous"]]
            
            if mushrooms:
                # Get highest confidence prediction
                best = max(mushrooms, key=lambda x: x.get("confidence", 0))
                
                return {
                    "result": best["class"].upper(),
                    "confidence": round(best["confidence"], 4),
                    "detections": len(mushrooms),
                    "all_predictions": mushrooms
                }
        
        return {
            "result": "NO MUSHROOM DETECTED",
            "confidence": 0,
            "detections": 0,
            "all_predictions": []
        }


class RoboflowLocalPredictor:
    """
    Predict using locally exported Roboflow models (YOLOv8).
    """
    
    def __init__(self, model_path: str):
        """
        Initialize with exported Roboflow model.
        
        Args:
            model_path: Path to exported model weights
        """
        try:
            from ultralytics import YOLO
            self.model = YOLO(model_path)
            self.device = "cuda" if self._has_cuda() else "cpu"
        except ImportError:
            raise ImportError("ultralytics package required. Install with: pip install ultralytics")
    
    def _has_cuda(self) -> bool:
        """Check if CUDA is available."""
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False
    
    def predict(self, image_path: str, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Make prediction using local YOLOv8 model.
        
        Args:
            image_path: Path to image
            confidence: Confidence threshold
            
        Returns:
            Prediction results
        """
        results = self.model.predict(
            source=image_path,
            conf=confidence,
            device=self.device
        )
        
        if not results:
            return {"result": "NO MUSHROOM DETECTED", "confidence": 0}
        
        result = results[0]
        
        if result.boxes is None or len(result.boxes) == 0:
            return {"result": "NO MUSHROOM DETECTED", "confidence": 0}
        
        # Get highest confidence detection
        boxes = result.boxes
        best_idx = boxes.conf.argmax().item()
        
        class_name = result.names[int(boxes.cls[best_idx])]
        confidence = float(boxes.conf[best_idx])
        
        return {
            "result": class_name.upper(),
            "confidence": round(confidence, 4),
            "all_detections": [
                {
                    "class": result.names[int(boxes.cls[i])],
                    "confidence": float(boxes.conf[i]),
                    "bbox": boxes.xyxy[i].tolist()
                }
                for i in range(len(boxes))
            ]
        }


# Backward compatibility with existing predict.py
def get_predictor(mode: str = "api"):
    """
    Get predictor instance.
    
    Args:
        mode: 'api' for Roboflow API, 'local' for exported model
    """
    if mode == "api":
        api_key = os.getenv("ROBOFLOW_API_KEY")
        project = os.getenv("ROBOFLOW_PROJECT")
        if not api_key or not project:
            raise ValueError("ROBOFLOW_API_KEY and ROBOFLOW_PROJECT env vars required")
        return RoboflowPredictor(api_key, project)
    
    elif mode == "local":
        model_path = os.getenv("ROBOFLOW_MODEL_PATH", "models/best.pt")
        return RoboflowLocalPredictor(model_path)
    
    else:
        raise ValueError("mode must be 'api' or 'local'")
