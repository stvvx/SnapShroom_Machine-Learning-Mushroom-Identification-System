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
    """Custom mushroom classification predictor"""
    
    def __init__(self, model_path: str = "models/mushroom_classifier.pth", 
                 classes_path: str = "models/mushroom_classes.json"):
        """
        Initialize predictor with trained model.
        
        Args:
            model_path: Path to trained model weights
            classes_path: Path to classes JSON file
        """
        self.model_path = model_path
        self.classes_path = classes_path
        self.model = None
        self.classes = None
        self.device = DEVICE
        
        self._load_model()
        self._load_classes()
        
    def _load_model(self):
        """Load the trained model"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found: {self.model_path}")
        
        # Load classes first to know num_classes
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")
        
        with open(self.classes_path, 'r') as f:
            classes_dict = json.load(f)
        
        num_classes = len(classes_dict['classes'])
        
        # Initialize model
        self.model = MushroomClassifier(num_classes=num_classes)
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
        print(f"✅ Model loaded: {self.model_path}")
    
    def _load_classes(self):
        """Load class names"""
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")
        
        with open(self.classes_path, 'r') as f:
            classes_dict = json.load(f)
        
        self.classes = classes_dict['classes']
        self.class_to_id = classes_dict['class_to_id']
        self.id_to_class = classes_dict['id_to_class']
        
        print(f"✅ Classes loaded: {len(self.classes)} mushroom types")
    
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
        Predict mushroom class from image.
        
        Args:
            image_input: Base64 string, numpy array, or PIL Image
            
        Returns:
            Dict with prediction results
        """
        try:
            # Preprocess image
            image_tensor = self._preprocess_image(image_input)
            
            # Get prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
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
                    "confidence": prob.item()
                }
                for prob, idx in zip(top_probs, top_indices)
            ]
            
            # Determine edibility based on CSV data
            edibility = self._get_edibility(class_name)
            
            return {
                "success": True,
                "detection": {
                    "found": True,
                    "confidence": round(confidence, 3)
                },
                "classification": {
                    "label": class_name,
                    "confidence": round(confidence, 3),
                    "top_predictions": top_predictions,
                    "toxicity_level": "SAFE" if edibility else "DANGEROUS"
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
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
        
        try:
            df = pd.read_csv("mushrooms10kinds.csv")
            row = df[df['english_name'] == mushroom_name]
            
            if not row.empty:
                return bool(row.iloc[0]['edible'])
        
        except Exception as e:
            print(f"⚠️ Could not determine edibility: {e}")
        
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
