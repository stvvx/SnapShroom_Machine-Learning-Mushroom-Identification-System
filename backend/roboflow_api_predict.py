"""
Roboflow API-based Prediction (Free Tier Compatible)
Uses Roboflow's cloud inference - no local model download needed!
"""

import base64
import requests
from typing import Dict, List, Tuple
import os
from dotenv import load_dotenv

load_dotenv()

class RoboflowAPIPredictor:
    """
    Uses Roboflow's cloud API for detection and classification.
    Completely free - no model weights needed!
    """
    
    def __init__(self, api_key: str, detection_project: str, classification_project: str):
        """
        Initialize with Roboflow API credentials.
        
        Args:
            api_key: Your Roboflow API key
            detection_project: e.g., "workspace/mushroom-detection"
            classification_project: e.g., "workspace/mushroom-edibility"
        """
        self.api_key = api_key
        self.detection_project = detection_project
        self.classification_project = classification_project
        
        # API endpoints
        self.roboflow_api = "https://detect.roboflow.com"
        
    def predict(self, image_base64: str = None, image_url: str = None) -> Dict:
        """
        Run detection + classification on image.
        
        Args:
            image_base64: Base64 encoded image string (without data:image/jpeg;base64, prefix)
            image_url: URL to image
            
        Returns:
            Dict with detection and classification results
        """
        try:
            # Step 1: Detection
            detection_results = self._detect_mushroom(image_base64, image_url)
            
            if not detection_results.get("success"):
                return {
                    "success": False,
                    "error": "Detection failed"
                }
            
            # Check if mushroom detected
            if not detection_results.get("predictions") or len(detection_results["predictions"]) == 0:
                return {
                    "success": True,
                    "detection": {
                        "found": False,
                        "confidence": 0,
                    },
                    "classification": {
                        "label": "UNKNOWN",
                        "confidence": 0,
                        "toxicity_level": "UNKNOWN"
                    }
                }
            
            # Step 2: Classification (if detection successful)
            classification_results = self._classify_mushroom(image_base64, image_url)
            
            return {
                "success": True,
                "detection": {
                    "found": True,
                    "confidence": round(detection_results["predictions"][0].get("confidence", 0), 3),
                    "bounding_box": self._format_bbox(detection_results["predictions"][0])
                },
                "classification": {
                    "label": classification_results.get("label", "UNKNOWN"),
                    "confidence": round(classification_results.get("confidence", 0), 3),
                    "toxicity_level": self._get_toxicity_level(classification_results.get("label"))
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _detect_mushroom(self, image_base64: str = None, image_url: str = None) -> Dict:
        """
        Call Roboflow detection API.
        """
        endpoint = f"{self.roboflow_api}/{self.detection_project}?api_key={self.api_key}"
        
        files = {}
        data = {}
        
        if image_base64:
            # Remove data URI prefix if present
            if image_base64.startswith("data:image"):
                image_base64 = image_base64.split(",")[1]
            files = {"imageToUpload": ("imageToUpload", base64.b64decode(image_base64))}
        elif image_url:
            data = {"image": image_url}
        else:
            raise ValueError("Either image_base64 or image_url must be provided")
        
        response = requests.post(endpoint, files=files, data=data)
        
        if response.status_code == 200:
            return {
                "success": True,
                "predictions": response.json().get("predictions", [])
            }
        else:
            return {
                "success": False,
                "error": f"API returned {response.status_code}"
            }
    
    def _classify_mushroom(self, image_base64: str = None, image_url: str = None) -> Dict:
        """
        Call Roboflow classification API.
        """
        endpoint = f"{self.roboflow_api}/{self.classification_project}?api_key={self.api_key}"
        
        files = {}
        data = {}
        
        if image_base64:
            # Remove data URI prefix if present
            if image_base64.startswith("data:image"):
                image_base64 = image_base64.split(",")[1]
            files = {"imageToUpload": ("imageToUpload", base64.b64decode(image_base64))}
        elif image_url:
            data = {"image": image_url}
        else:
            return {"label": "UNKNOWN", "confidence": 0}
        
        response = requests.post(endpoint, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            # Classification returns: {"predictions": {"EDIBLE": 0.95, "POISONOUS": 0.05}, ...}
            predictions = result.get("predictions", {})
            
            if predictions:
                # Get highest confidence label
                label = max(predictions, key=predictions.get)
                confidence = predictions[label]
                return {
                    "label": label.upper(),
                    "confidence": confidence
                }
        
        return {"label": "UNKNOWN", "confidence": 0}
    
    def _format_bbox(self, prediction: Dict) -> List[float]:
        """Format bounding box coordinates."""
        try:
            x = prediction.get("x", 0)
            y = prediction.get("y", 0)
            width = prediction.get("width", 0)
            height = prediction.get("height", 0)
            return [x, y, width, height]
        except:
            return [0, 0, 0, 0]
    
    def _get_toxicity_level(self, label: str) -> str:
        """Convert classification to toxicity level."""
        if label == "EDIBLE":
            return "SAFE"
        elif label == "POISONOUS":
            return "DANGEROUS"
        else:
            return "UNKNOWN"


# Convenience function
def create_predictor() -> RoboflowAPIPredictor:
    """Create predictor from environment variables."""
    api_key = os.getenv("ROBOFLOW_API_KEY")
    detection_project = os.getenv("ROBOFLOW_DETECTION_PROJECT")
    classification_project = os.getenv("ROBOFLOW_CLASSIFICATION_PROJECT")
    
    if not all([api_key, detection_project, classification_project]):
        raise ValueError("Missing Roboflow environment variables in .env")
    
    return RoboflowAPIPredictor(api_key, detection_project, classification_project)


if __name__ == "__main__":
    # Test the predictor
    predictor = create_predictor()
    print("✅ Roboflow API Predictor initialized!")
    print(f"Detection Project: {predictor.detection_project}")
    print(f"Classification Project: {predictor.classification_project}")
