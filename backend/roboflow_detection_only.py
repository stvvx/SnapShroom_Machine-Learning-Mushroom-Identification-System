"""
Roboflow Detection-Only Predictor
Use this while waiting for classification model to train.
Returns: Detected mushrooms with bounding boxes, no edibility classification yet.
"""
import os
from typing import Dict, List, Any
from PIL import Image
import torch
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()


class RoboflowDetectionOnly:
    """
    Detection-only predictor using Roboflow YOLOv8 model.
    Just finds mushrooms, doesn't classify edibility yet.
    """
    
    def __init__(self, detection_model_path: str = "models/detection.pt"):
        """
        Initialize with detection model only.
        
        Args:
            detection_model_path: Path to YOLOv8 detection model
        """
        print("🔧 Loading detection model...")
        
        if not os.path.exists(detection_model_path):
            raise FileNotFoundError(f"Detection model not found: {detection_model_path}")
        
        self.detector = YOLO(detection_model_path)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"✅ Detection model loaded on device: {self.device}")
    
    def predict(
        self,
        image_path: str,
        confidence_threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Detect mushrooms in image.
        
        Args:
            image_path: Path to image
            confidence_threshold: Minimum confidence for detections
            
        Returns:
            {
                "status": "success",
                "total_detections": 2,
                "mushrooms": [
                    {
                        "id": 0,
                        "location": {"x1": 100, "y1": 200, "x2": 300, "y2": 400},
                        "confidence": 0.95,
                        "class": "mushroom"  (will add edibility later)
                    }
                ]
            }
        """
        if not os.path.exists(image_path):
            return {"status": "error", "message": f"Image not found: {image_path}"}
        
        try:
            print(f"🔍 Detecting mushrooms in: {image_path}")
            
            # Detection
            detection_results = self.detector.predict(
                source=image_path,
                conf=confidence_threshold,
                device=self.device,
                verbose=False
            )
            
            if not detection_results or detection_results[0].boxes is None:
                return {
                    "status": "success",
                    "total_detections": 0,
                    "message": "No mushrooms detected",
                    "mushrooms": []
                }
            
            detection_result = detection_results[0]
            boxes = detection_result.boxes
            
            if len(boxes) == 0:
                return {
                    "status": "success",
                    "total_detections": 0,
                    "message": "No mushrooms detected",
                    "mushrooms": []
                }
            
            # Parse detections
            mushrooms = []
            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                confidence = float(box.conf[0])
                class_idx = int(box.cls[0])
                class_name = detection_result.names[class_idx]
                
                mushrooms.append({
                    "id": idx,
                    "location": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "width": x2 - x1,
                        "height": y2 - y1
                    },
                    "class": class_name,
                    "confidence": round(confidence, 4),
                    "status": "⏳ Classification coming soon"
                })
            
            return {
                "status": "success",
                "total_detections": len(mushrooms),
                "note": "Edibility classification not yet available. Train classification model on Roboflow to add it.",
                "mushrooms": mushrooms
            }
        
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def predict_batch(
        self,
        image_paths: List[str],
        confidence_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Detect mushrooms in multiple images.
        """
        results = []
        for i, image_path in enumerate(image_paths):
            print(f"Processing {i + 1}/{len(image_paths)}: {image_path}")
            result = self.predict(image_path, confidence_threshold)
            results.append(result)
        return results


# Quick function for Flask
def detect_mushrooms(image_path: str) -> Dict[str, Any]:
    """
    Quick detection function for Flask routes.
    """
    try:
        detector = RoboflowDetectionOnly(
            detection_model_path=os.getenv("DETECTION_MODEL_PATH", "models/detection.pt")
        )
        return detector.predict(image_path)
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    detector = RoboflowDetectionOnly("models/detection.pt")
    result = detector.predict("test_image.jpg")
    print(result)
