"""
Unified Roboflow Prediction: Detection + Classification in One Pipeline
Finds mushrooms AND determines if they're edible in a single process.
"""
import os
from typing import Dict, List, Any
from PIL import Image
import torch
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()


class RoboflowUnifiedPredictor:
    """
    Unified predictor: Detection + Classification.
    1. Detects mushrooms in image (YOLOv8 detection)
    2. Classifies each detection as edible/poisonous (YOLOv8 classification)
    """
    
    def __init__(
        self,
        detection_model_path: str = "models/detection.pt",
        classification_model_path: str = "models/classification.pt"
    ):
        """
        Initialize with both detection and classification models.
        
        Args:
            detection_model_path: Path to YOLOv8 detection model
            classification_model_path: Path to YOLOv8 classification model
        """
        print("🔧 Loading models...")
        
        if not os.path.exists(detection_model_path):
            raise FileNotFoundError(f"Detection model not found: {detection_model_path}")
        if not os.path.exists(classification_model_path):
            raise FileNotFoundError(f"Classification model not found: {classification_model_path}")
        
        self.detector = YOLO(detection_model_path)
        self.classifier = YOLO(classification_model_path)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"✅ Models loaded on device: {self.device}")
    
    def predict(
        self,
        image_path: str,
        confidence_threshold: float = 0.5,
        return_crops: bool = False
    ) -> Dict[str, Any]:
        """
        Detect mushrooms and classify edibility in one go.
        
        Args:
            image_path: Path to image
            confidence_threshold: Minimum confidence for detections
            return_crops: Include cropped mushroom images in output
            
        Returns:
            {
                "status": "success",
                "total_detections": 2,
                "mushrooms": [
                    {
                        "id": 0,
                        "location": {"x1": 100, "y1": 200, "x2": 300, "y2": 400},
                        "detection_confidence": 0.95,
                        "edibility": "EDIBLE",
                        "edibility_confidence": 0.92,
                        "recommendation": "Safe to eat"
                    },
                    ...
                ]
            }
        """
        if not os.path.exists(image_path):
            return {"status": "error", "message": f"Image not found: {image_path}"}
        
        try:
            # Load image
            image = Image.open(image_path).convert("RGB")
            
            # 1. DETECTION PHASE: Find mushrooms
            print(f"🔍 Detecting mushrooms...")
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
            
            # 2. CLASSIFICATION PHASE: Classify each detection
            print(f"🍄 Classifying {len(boxes)} mushroom(s)...")
            mushrooms = []
            
            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                detection_conf = float(box.conf[0])
                
                # Crop mushroom region
                crop = image.crop((x1, y1, x2, y2))
                
                # Classify the crop
                classification_results = self.classifier.predict(
                    source=crop,
                    conf=0.3,
                    device=self.device,
                    verbose=False
                )
                
                if classification_results and classification_results[0].probs is not None:
                    probs = classification_results[0].probs
                    class_idx = int(probs.top1)
                    class_name = classification_results[0].names[class_idx]
                    class_conf = float(probs.top1conf)
                else:
                    class_name = "UNKNOWN"
                    class_conf = 0.0
                
                # Determine if edible (normalize output)
                edibility = class_name.upper()
                if "EDIBLE" in edibility:
                    edibility = "EDIBLE"
                    recommendation = "✅ Safe to eat"
                elif "POISON" in edibility:
                    edibility = "POISONOUS"
                    recommendation = "❌ DO NOT EAT - Potentially toxic"
                else:
                    edibility = "UNKNOWN"
                    recommendation = "⚠️  Classification uncertain"
                
                # Save crop if requested
                crop_path = None
                if return_crops:
                    crop_path = f"uploads/mushroom_{idx}.jpg"
                    os.makedirs("uploads", exist_ok=True)
                    crop.save(crop_path)
                
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
                    "detection_confidence": round(detection_conf, 4),
                    "edibility": edibility,
                    "edibility_confidence": round(class_conf, 4),
                    "recommendation": recommendation,
                    "crop_path": crop_path
                })
            
            return {
                "status": "success",
                "total_detections": len(mushrooms),
                "image_path": image_path,
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
        Predict on multiple images.
        
        Args:
            image_paths: List of image paths
            confidence_threshold: Minimum confidence
            
        Returns:
            List of prediction results
        """
        results = []
        for i, image_path in enumerate(image_paths):
            print(f"Processing {i + 1}/{len(image_paths)}: {image_path}")
            result = self.predict(image_path, confidence_threshold)
            results.append(result)
        return results


# Convenience function for Flask routes
def predict_mushroom_edibility(image_path: str) -> Dict[str, Any]:
    """
    Quick prediction function for Flask integration.
    
    Usage in routes:
        from roboflow_unified_predict import predict_mushroom_edibility
        result = predict_mushroom_edibility("uploads/image.jpg")
    """
    try:
        predictor = RoboflowUnifiedPredictor(
            detection_model_path=os.getenv("DETECTION_MODEL_PATH", "models/detection.pt"),
            classification_model_path=os.getenv("CLASSIFICATION_MODEL_PATH", "models/classification.pt")
        )
        return predictor.predict(image_path)
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    # Example usage
    predictor = RoboflowUnifiedPredictor(
        detection_model_path="models/detection.pt",
        classification_model_path="models/classification.pt"
    )
    
    # Single image
    result = predictor.predict("test_image.jpg")
    print("\nPrediction Result:")
    print(result)
    
    # Multiple images
    # results = predictor.predict_batch(["image1.jpg", "image2.jpg"])
