"""
Custom Mushroom Classifier - Prediction Module
Uses locally trained PyTorch model for inference
"""

import torch
import torch.nn as nn
import numpy as np
import cv2
import json
import os
from torchvision import transforms, models
from PIL import Image
import io
import base64
from typing import Dict, Tuple

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_SIZE = 224


class MushroomDetector(nn.Module):
    """Binary classifier: Mushroom or Not Mushroom"""
    
    def __init__(self):
        super(MushroomDetector, self).__init__()
        self.backbone = models.resnet50(pretrained=False)
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(num_features, 2)  # Binary: not mushroom, mushroom
    
    def forward(self, x):
        return self.backbone(x)


class MushroomClassifier(nn.Module):
    """ResNet50-based mushroom classifier"""
    
    def __init__(self, num_classes):
        super(MushroomClassifier, self).__init__()
        self.backbone = models.resnet50(pretrained=False)
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(num_features, num_classes)
    
    def forward(self, x):
        return self.backbone(x)


class CustomMushroomPredictor:
    """Two-stage mushroom prediction: Detection -> Classification"""
    
    def __init__(self, 
                 detector_path: str = "models/mushroom_detector.pth",
                 classifier_path: str = "models/mushroom_classifier.pth", 
                 classes_path: str = "models/mushroom_classes.json"):
        """
        Initialize predictor with both detector and classifier models.
        
        Args:
            detector_path: Path to binary mushroom detector model
            classifier_path: Path to multi-class classifier model
            classes_path: Path to classes JSON file
        """
        # Resolve paths relative to this script's directory (backend/)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.detector_path = os.path.join(script_dir, detector_path)
        self.classifier_path = os.path.join(script_dir, classifier_path)
        self.classes_path = os.path.join(script_dir, classes_path)
        self.detector = None
        self.classifier = None
        self.classes = None
        self.device = DEVICE
        
        self._load_detector()
        self._load_classifier()
        self._load_classes()
    
    def _load_detector(self):
        """Load the binary mushroom detector"""
        if not os.path.exists(self.detector_path):
            print(f"[WARN] Detector not found: {self.detector_path}")
            print(f"       Run: python train_mushroom_detector.py")
            return
        
        self.detector = MushroomDetector()
        self.detector.load_state_dict(torch.load(self.detector_path, map_location=self.device))
        self.detector.to(self.device)
        self.detector.eval()
        
        print(f"[OK] Detector loaded: {self.detector_path}")
    
    def _load_classifier(self):
        """Load the multi-class mushroom classifier"""
        if not os.path.exists(self.classifier_path):
            raise FileNotFoundError(f"Classifier not found: {self.classifier_path}")
        
        # Load classes first to know num_classes
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")
        
        with open(self.classes_path, 'r') as f:
            classes_dict = json.load(f)
        
        num_classes = len(classes_dict['classes'])
        
        # Initialize classifier
        self.classifier = MushroomClassifier(num_classes=num_classes)
        self.classifier.load_state_dict(torch.load(self.classifier_path, map_location=self.device))
        self.classifier.to(self.device)
        self.classifier.eval()
        
        print(f"[OK] Classifier loaded: {self.classifier_path}")
    def _load_classes(self):
        """Load class names"""
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")
        
        with open(self.classes_path, 'r') as f:
            classes_dict = json.load(f)
        
        self.classes = classes_dict['classes']
        self.class_to_id = classes_dict['class_to_id']
        self.id_to_class = classes_dict['id_to_class']
        
        print(f"[OK] Classes loaded: {len(self.classes)} mushroom types")
    
    def _preprocess_image(self, image_input) -> torch.Tensor:
        """
        Preprocess image for model input.
        
        Args:
            image_input: Either PIL Image, numpy array, or base64 string
            
        Returns:
            Preprocessed tensor
        """
        # Handle different input types
        if isinstance(image_input, str):
            # Base64 string
            if image_input.startswith("data:image"):
                image_input = image_input.split(",")[1]
            
            image_data = base64.b64decode(image_input)
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        elif isinstance(image_input, np.ndarray):
            # Numpy array
            image = Image.fromarray(image_input.astype('uint8')).convert('RGB')
        
        elif isinstance(image_input, Image.Image):
            # PIL Image
            if image_input.mode != 'RGB':
                image = image_input.convert('RGB')
            else:
                image = image_input
        
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
        
        # Apply transforms
        transform = transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        return transform(image).unsqueeze(0).to(self.device)
    
    def predict(self, image_input) -> Dict:
        """
        Two-stage prediction: Detect mushroom, then classify.
        
        Args:
            image_input: Base64 string, numpy array, or PIL Image
            
        Returns:
            Dict with detection + classification results
        """
        try:
            # Preprocess image
            image_tensor = self._preprocess_image(image_input)
            
            # ============ STAGE 1: DETECT MUSHROOM ============
            detection_result = self._detect_mushroom(image_tensor)
            
            if not detection_result["found"]:
                return {
                    "success": True,
                    "detection": detection_result,
                    "classification": None,
                    "message": "No mushroom detected in image"
                }
            
            # ============ STAGE 2: CLASSIFY MUSHROOM ============
            classification_result = self._classify_mushroom(image_tensor)
            
            return {
                "success": True,
                "detection": detection_result,
                "classification": classification_result
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _detect_mushroom(self, image_tensor: torch.Tensor) -> Dict:
        """
        Stage 1: Detect if image contains a mushroom
        
        Returns:
            Dict with detection confidence
        """
        if self.detector is None:
            return {
                "found": True,  # Assume mushroom if detector not available
                "confidence": 0.0,
                "warning": "Detector not loaded, assuming mushroom"
            }
        
        with torch.no_grad():
            outputs = self.detector(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, class_idx = torch.max(probabilities, 1)
        
        class_idx = class_idx.item()
        confidence = confidence.item()
        
        # class_idx 0 = not mushroom, 1 = mushroom
        is_mushroom = class_idx == 1
        
        return {
            "found": is_mushroom,
            "confidence": round(confidence, 3),
            "prediction": "Mushroom" if is_mushroom else "Not a Mushroom"
        }
    
    def _classify_mushroom(self, image_tensor: torch.Tensor) -> Dict:
        """
        Stage 2: Classify mushroom type
        
        Returns:
            Dict with classification results
        """
        with torch.no_grad():
            outputs = self.classifier(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, class_idx = torch.max(probabilities, 1)
        
        class_idx = class_idx.item()
        confidence = confidence.item()
        class_name = self.classes[class_idx]
        
        # Get top 3 predictions
        top_probs, top_indices = torch.topk(probabilities[0], min(3, len(self.classes)))
        top_predictions = [
            {
                "class": self.classes[idx.item()],
                "confidence": round(prob.item(), 3)
            }
            for prob, idx in zip(top_probs, top_indices)
        ]
        
        # Determine edibility based on CSV data
        edibility = self._get_edibility(class_name)
        
        return {
            "label": class_name,
            "confidence": round(confidence, 3),
            "top_predictions": top_predictions,
            "toxicity_level": "SAFE" if edibility else "DANGEROUS",
            "edible": edibility
        }
    
    def _get_edibility(self, mushroom_name: str) -> bool:
        """
        Check if mushroom is edible based on CSV data.
        
        Args:
            mushroom_name: Name of mushroom
            
        Returns:
            True if edible, False if poisonous
        """
        # Load CSV to check edibility
        import pandas as pd
        import os
        
        try:
            # Try multiple possible locations
            possible_paths = [
                "frontend/mushrooms10kinds.csv",
                "../frontend/mushrooms10kinds.csv",
                "mushrooms10kinds.csv"
            ]
            
            csv_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    csv_path = path
                    break
            
            if csv_path:
                df = pd.read_csv(csv_path)
                row = df[df['english_name'] == mushroom_name]
                
                if not row.empty:
                    return bool(row.iloc[0]['edible'])
        
        except Exception as e:
            print(f"Could not determine edibility: {e}")
        
        return False


def create_predictor():
    """Factory function to create predictor"""
    return CustomMushroomPredictor()


if __name__ == "__main__":
    # Test the predictor
    try:
        predictor = create_predictor()
        print("✅ Predictor initialized successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
