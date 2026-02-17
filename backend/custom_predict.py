"""
Custom Mushroom Classifier - Prediction Module
================================================

Two-Stage Mushroom Identification System:
1. Detection Stage: Binary classification (Mushroom vs Not Mushroom)
2. Classification Stage: Multi-class identification (10 mushroom species)
3. Database Query: Fetch detailed species information from MongoDB

Models:
- Detector: ResNet50 trained on mushroom vs non-mushroom images
- Classifier: ResNet50 trained on 10 Filipino mushroom species

Data Flow:
1. Image preprocessing (resize, normalize)
2. Stage 1: Detect if mushroom is present (confidence threshold)
3. Stage 2: Classify mushroom species if detected
4. Query database for edibility and safety information
5. Return comprehensive prediction results
"""

import torch
import torch.nn as nn
import numpy as np
import cv2
import json
import os
import logging
from torchvision import transforms, models
from PIL import Image
import io
import base64
from typing import Dict, Tuple, Optional, List
from functools import lru_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_SIZE = 224
DETECTION_CONFIDENCE_THRESHOLD = 0.60  # Minimum confidence for mushroom detection
CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.30  # Minimum confidence for classification
MAX_TOP_PREDICTIONS = 3  # Number of top predictions to return


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
        # Match training architecture: Sequential with Dropout + Linear
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)


class CustomMushroomPredictor:
    """
    Two-Stage Mushroom Prediction System
    
    Architecture:
    1. Detection: Binary classifier (mushroom vs non-mushroom)
    2. Classification: Multi-class classifier (10 species)
    3. Database Integration: Fetch edibility and safety info
    
    Features:
    - Confidence thresholds for quality control
    - Top-K predictions for species classification
    - Automatic database lookup for species metadata
    - Comprehensive error handling and logging
    - Image preprocessing with normalization
    """
    
    def __init__(self, 
                 detector_path: str = "models/mushroom_detector.pth",
                 classifier_path: str = "models/mushroom_classifier.pth", 
                 classes_path: str = "models/mushroom_classes.json",
                 enable_caching: bool = True):
        """
        Initialize predictor with models and configuration.
        
        Args:
            detector_path: Path to binary mushroom detector model
            classifier_path: Path to multi-class classifier model
            classes_path: Path to classes JSON file
            enable_caching: Enable species data caching for performance
        
        Raises:
            FileNotFoundError: If model files are not found
            RuntimeError: If model loading fails
        """
        # Resolve paths relative to backend directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.detector_path = os.path.join(script_dir, detector_path)
        self.classifier_path = os.path.join(script_dir, classifier_path)
        self.classes_path = os.path.join(script_dir, classes_path)
        
        # Model containers
        self.detector = None
        self.classifier = None
        self.classes = None
        self.class_to_id = None
        self.id_to_class = None
        
        # Configuration
        self.device = DEVICE
        self.enable_caching = enable_caching
        self._species_cache = {}  # Cache for database lookups
        
        # Load models and classes
        logger.info(f"Initializing CustomMushroomPredictor on device: {DEVICE}")
        self._load_detector()
        self._load_classifier()
        self._load_classes()
        logger.info("CustomMushroomPredictor initialized successfully")
    
    def _load_detector(self):
        """
        Load the binary mushroom detector model.
        
        The detector is optional - if not found, system assumes all images contain mushrooms.
        This allows the classifier to work independently during development.
        
        Raises:
            RuntimeError: If detector file exists but fails to load
        """
        if not os.path.exists(self.detector_path):
            logger.warning(f"Detector not found: {self.detector_path}")
            logger.warning("Skipping detection stage - all images assumed to contain mushrooms")
            logger.info("To enable detection: python train_mushroom_detector.py")
            return
        
        try:
            self.detector = MushroomDetector()
            
            # Load checkpoint
            checkpoint = torch.load(self.detector_path, map_location=self.device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                # Checkpoint saved with metadata
                logger.info("Loading detector from checkpoint with metadata")
                self.detector.load_state_dict(checkpoint['model_state_dict'])
            else:
                # Checkpoint is just the state dict
                logger.info("Loading detector from plain state dict")
                self.detector.load_state_dict(checkpoint)
            
            self.detector.to(self.device)
            self.detector.eval()
            
            logger.info(f"Detector loaded successfully: {self.detector_path}")
        except Exception as e:
            logger.error(f"Failed to load detector: {e}")
            raise RuntimeError(f"Detector loading failed: {e}")
    
    def _load_classifier(self):
        """
        Load the multi-class mushroom classifier model.
        
        The classifier is REQUIRED for the system to function.
        
        Raises:
            FileNotFoundError: If classifier or classes file not found
            RuntimeError: If model loading fails
        """
        if not os.path.exists(self.classifier_path):
            raise FileNotFoundError(
                f"Classifier not found: {self.classifier_path}\n"
                f"Train the model using: python train_custom.py"
            )
        
        # Load classes first to determine number of output classes
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(
                f"Classes file not found: {self.classes_path}\n"
                f"Ensure mushroom_classes.json exists in models/ directory"
            )
        
        try:
            with open(self.classes_path, 'r') as f:
                classes_dict = json.load(f)
            
            num_classes = len(classes_dict['class_names'])
            logger.info(f"Loading classifier for {num_classes} classes")
            
            # Initialize classifier
            self.classifier = MushroomClassifier(num_classes=num_classes)
            
            # Load checkpoint
            checkpoint = torch.load(self.classifier_path, map_location=self.device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                # Checkpoint saved with metadata
                logger.info("Loading model from checkpoint with metadata")
                self.classifier.load_state_dict(checkpoint['model_state_dict'])
                if 'best_accuracy' in checkpoint:
                    logger.info(f"Model best accuracy: {checkpoint['best_accuracy']:.2%}")
            else:
                # Checkpoint is just the state dict
                logger.info("Loading model from plain state dict")
                self.classifier.load_state_dict(checkpoint)
            
            self.classifier.to(self.device)
            self.classifier.eval()
            
            logger.info(f"Classifier loaded successfully: {self.classifier_path}")
        except Exception as e:
            logger.error(f"Failed to load classifier: {e}")
            raise RuntimeError(f"Classifier loading failed: {e}")
    def _load_classes(self):
        """
        Load class names and ID mappings.
        
        Raises:
            FileNotFoundError: If classes file not found
            ValueError: If classes file format is invalid
        """
        if not os.path.exists(self.classes_path):
            raise FileNotFoundError(f"Classes file not found: {self.classes_path}")
        
        try:
            with open(self.classes_path, 'r') as f:
                classes_dict = json.load(f)
            
            # Validate required fields
            required_fields = ['class_names', 'class_to_idx', 'idx_to_class']
            for field in required_fields:
                if field not in classes_dict:
                    raise ValueError(f"Missing required field '{field}' in classes file")
            
            self.classes = classes_dict['class_names']
            self.class_to_id = classes_dict['class_to_idx']
            self.id_to_class = classes_dict['idx_to_class']
            
            logger.info(f"Classes loaded: {len(self.classes)} mushroom species")
            logger.debug(f"Species: {', '.join(self.classes)}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in classes file: {e}")
        except Exception as e:
            logger.error(f"Failed to load classes: {e}")
            raise
    
    def _preprocess_image(self, image_input) -> torch.Tensor:
        """
        Preprocess image for model input.
        
        Handles multiple input formats:
        - Base64 encoded strings (with or without data URI prefix)
        - Numpy arrays (uint8, RGB or grayscale)
        - PIL Image objects (any mode)
        
        Processing steps:
        1. Convert to PIL RGB image
        2. Resize to 224x224
        3. Convert to tensor
        4. Normalize using ImageNet statistics
        
        Args:
            image_input: Image in base64, numpy array, or PIL format
            
        Returns:
            Preprocessed tensor ready for model input (1, 3, 224, 224)
            
        Raises:
            ValueError: If input type is unsupported or image is invalid
        """
        try:
            # Handle different input types
            if isinstance(image_input, str):
                # Base64 string
                if image_input.startswith("data:image"):
                    # Remove data URI prefix
                    image_input = image_input.split(",")[1]
                
                # Decode base64
                image_data = base64.b64decode(image_input)
                image = Image.open(io.BytesIO(image_data)).convert('RGB')
                logger.debug("Loaded image from base64 string")
            
            elif isinstance(image_input, np.ndarray):
                # Numpy array
                if image_input.dtype != np.uint8:
                    logger.warning(f"Converting numpy array from {image_input.dtype} to uint8")
                    image_input = (image_input * 255).astype(np.uint8)
                
                image = Image.fromarray(image_input).convert('RGB')
                logger.debug("Loaded image from numpy array")
            
            elif isinstance(image_input, Image.Image):
                # PIL Image
                if image_input.mode != 'RGB':
                    image = image_input.convert('RGB')
                    logger.debug(f"Converted image from {image_input.mode} to RGB")
                else:
                    image = image_input
            
            else:
                raise ValueError(
                    f"Unsupported image input type: {type(image_input)}. "
                    f"Supported types: str (base64), numpy.ndarray, PIL.Image"
                )
            
            # Validate image
            if image.size[0] == 0 or image.size[1] == 0:
                raise ValueError(f"Invalid image dimensions: {image.size}")
            
            logger.debug(f"Original image size: {image.size}")
            
            # Apply transforms (ResNet50 standard preprocessing)
            transform = transforms.Compose([
                transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],  # ImageNet mean
                    std=[0.229, 0.224, 0.225]     # ImageNet std
                )
            ])
            
            tensor = transform(image).unsqueeze(0).to(self.device)
            logger.debug(f"Preprocessed tensor shape: {tensor.shape}")
            
            return tensor
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise ValueError(f"Failed to preprocess image: {e}")
    
    def predict(self, image_input) -> Dict:
        """
        Main prediction pipeline: Detection → Classification → Database Lookup
        
        Pipeline Stages:
        1. Image Preprocessing: Resize, normalize, convert to tensor
        2. Detection: Binary classification (mushroom vs not mushroom)
        3. Classification: Multi-class identification (10 species)
        4. Database Query: Fetch edibility and safety information
        
        Args:
            image_input: Image in one of these formats:
                - base64 string (with or without data URI prefix)
                - numpy array (preferably uint8 RGB)
                - PIL Image object
        
        Returns:
            Dict with comprehensive prediction results:
            Success case:
            {
                "success": True,
                "detection": {
                    "found": bool,
                    "confidence": float,
                    "prediction": str
                },
                "classification": {
                    "label": str,
                    "confidence": float,
                    "top_predictions": List[Dict],
                    "toxicity_level": str,
                    "edible": bool
                },
                "message": str (optional)
            }
            
            Failure case:
            {
                "success": False,
                "error": str,
                "error_type": str
            }
        """
        try:
            logger.info("Starting mushroom prediction pipeline")
            
            # ============ PREPROCESSING ============
            logger.info("Stage 0: Image preprocessing")
            image_tensor = self._preprocess_image(image_input)
            
            # ============ STAGE 1: DETECTION ============
            logger.info("Stage 1: Mushroom detection")
            detection_result = self._detect_mushroom(image_tensor)
            
            if not detection_result["found"]:
                logger.info("No mushroom detected - stopping pipeline")
                return {
                    "success": True,
                    "detection": detection_result,
                    "classification": None,
                    "message": (
                        "No mushroom detected in the image. "
                        "Please ensure the image shows a clear view of the mushroom."
                    )
                }
            
            # ============ STAGE 2: CLASSIFICATION ============
            logger.info("Stage 2: Species classification")
            classification_result = self._classify_mushroom(image_tensor)
            
            result = {
                "success": True,
                "detection": detection_result,
                "classification": classification_result
            }
            
            logger.info(f"Prediction complete: {classification_result['label']}")
            logger.info(f"Safety: {classification_result['toxicity_level']}")
            
            return result
        
        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except RuntimeError as e:
            logger.error(f"Runtime error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "runtime_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Prediction failed: {str(e)}",
                "error_type": "unexpected_error"
            }
    
    def _detect_mushroom(self, image_tensor: torch.Tensor) -> Dict:
        """
        Stage 1: Binary Detection - Mushroom vs Not Mushroom
        
        Uses binary classifier to determine if image contains a mushroom.
        If detector is not loaded, assumes all images contain mushrooms.
        
        Confidence Threshold:
        - Detections below DETECTION_CONFIDENCE_THRESHOLD are rejected
        - This prevents false positives on non-mushroom images
        
        Args:
            image_tensor: Preprocessed image tensor (1, 3, 224, 224)
            
        Returns:
            Dict with detection results:
            {
                "found": bool,
                "confidence": float,
                "prediction": str,
                "warning": str (optional)
            }
        """
        if self.detector is None:
            logger.debug("Detector not loaded, assuming mushroom present")
            return {
                "found": True,
                "confidence": 0.0,
                "prediction": "Assumed Mushroom",
                "warning": "Detector not loaded - skipping detection stage"
            }
        
        try:
            with torch.no_grad():
                outputs = self.detector(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                confidence, class_idx = torch.max(probabilities, 1)
            
            class_idx = class_idx.item()
            confidence = confidence.item()
            
            # class_idx 0 = not mushroom, 1 = mushroom
            is_mushroom = class_idx == 1
            
            # Apply confidence threshold
            if is_mushroom and confidence < DETECTION_CONFIDENCE_THRESHOLD:
                logger.warning(f"Low detection confidence: {confidence:.3f} < {DETECTION_CONFIDENCE_THRESHOLD}")
                is_mushroom = False
            
            result = {
                "found": is_mushroom,
                "confidence": round(confidence, 3),
                "prediction": "Mushroom" if is_mushroom else "Not a Mushroom"
            }
            
            logger.info(f"Detection: {result['prediction']} (confidence: {result['confidence']})")
            return result
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            # Fallback to assuming mushroom on error
            return {
                "found": True,
                "confidence": 0.0,
                "prediction": "Error - Assumed Mushroom",
                "warning": f"Detection error: {str(e)}"
            }
    
    def _classify_mushroom(self, image_tensor: torch.Tensor) -> Dict:
        """
        Stage 2: Multi-Class Classification - Identify Mushroom Species
        
        Classifies mushroom into one of 10 trained species categories.
        Returns top-K predictions with confidence scores.
        
        Species Classified:
        - Wood Ear, White Oyster, Enoki, Shiitake, Button (edible)
        - Death Cap, False Morel, Jack O'Lantern, Funeral Bell, Red Cage (poisonous)
        
        Args:
            image_tensor: Preprocessed image tensor (1, 3, 224, 224)
            
        Returns:
            Dict with classification results:
            {
                "label": str (predicted species),
                "confidence": float,
                "top_predictions": List[Dict] (top-K predictions),
                "toxicity_level": str ("SAFE" or "DANGEROUS"),
                "edible": bool,
                "warning": str (optional low confidence warning)
            }
        """
        try:
            with torch.no_grad():
                outputs = self.classifier(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                confidence, class_idx = torch.max(probabilities, 1)
            
            class_idx = class_idx.item()
            confidence = confidence.item()
            class_name = self.classes[class_idx]
            
            # Get top-K predictions
            k = min(MAX_TOP_PREDICTIONS, len(self.classes))
            top_probs, top_indices = torch.topk(probabilities[0], k)
            top_predictions = [
                {
                    "class": self.classes[idx.item()],
                    "confidence": round(prob.item(), 3)
                }
                for prob, idx in zip(top_probs, top_indices)
            ]
            
            # Query database for edibility (with caching)
            edibility = self._get_edibility(class_name)
            
            result = {
                "label": class_name,
                "confidence": round(confidence, 3),
                "top_predictions": top_predictions,
                "toxicity_level": "SAFE" if edibility else "DANGEROUS",
                "edible": edibility
            }
            
            # Add warning for low confidence predictions
            if confidence < CLASSIFICATION_CONFIDENCE_THRESHOLD:
                result["warning"] = (
                    f"Low classification confidence ({confidence:.1%}). "
                    f"Consider manual verification by an expert."
                )
                logger.warning(f"Low confidence classification: {class_name} ({confidence:.3f})")
            
            logger.info(f"Classification: {class_name} (confidence: {confidence:.3f})")
            logger.debug(f"Top 3: {[p['class'] for p in top_predictions]}")
            
            return result
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            raise RuntimeError(f"Classification error: {e}")
    
    def _get_edibility(self, mushroom_name: str) -> bool:
        """
        Query database for mushroom edibility information.
        
        Implements caching to reduce database queries for frequently
        requested species.
        
        Safety Note:
        - Defaults to FALSE (poisonous) if database lookup fails
        - This is a safety-first approach - better to be overly cautious
        
        Args:
            mushroom_name: English name of mushroom species
            
        Returns:
            True if edible, False if poisonous or unknown
        """
        # Check cache first
        if self.enable_caching and mushroom_name in self._species_cache:
            logger.debug(f"Cache hit for species: {mushroom_name}")
            return self._species_cache[mushroom_name]
        
        try:
            from services.species_service import SpeciesService
            species_service = SpeciesService()
            
            # Search database by English name
            species_list = species_service.search_species(mushroom_name)
            
            if species_list and len(species_list) > 0:
                edible = species_list[0].get('edible', False)
                
                # Cache result
                if self.enable_caching:
                    self._species_cache[mushroom_name] = edible
                    logger.debug(f"Cached edibility for {mushroom_name}: {edible}")
                
                logger.info(f"Database lookup: {mushroom_name} is {'EDIBLE' if edible else 'POISONOUS'}")
                return edible
            else:
                logger.warning(f"No database entry found for: {mushroom_name}")
        
        except Exception as e:
            logger.error(f"Database lookup failed for '{mushroom_name}': {e}")
        
        # SAFETY FIRST: Default to poisonous if unknown
        logger.warning(f"Defaulting to POISONOUS for unknown species: {mushroom_name}")
        return False
    
    def clear_cache(self):
        """Clear species edibility cache."""
        self._species_cache.clear()
        logger.info("Species cache cleared")


def create_predictor():
    """
    Factory function to create a CustomMushroomPredictor instance.
    
    This is the recommended way to instantiate the predictor.
    
    Returns:
        CustomMushroomPredictor: Initialized predictor ready for inference
        
    Raises:
        FileNotFoundError: If required model files are missing
        RuntimeError: If model initialization fails
    """
    logger.info("Creating mushroom predictor instance")
    return CustomMushroomPredictor()


if __name__ == "__main__":
    # Test the predictor initialization
    print("===" * 20)
    print("Testing CustomMushroomPredictor Initialization")
    print("===" * 20)
    
    try:
        predictor = create_predictor()
        print("\n✅ SUCCESS: Predictor initialized successfully!")
        print(f"\nConfiguration:")
        print(f"  Device: {predictor.device}")
        print(f"  Detector: {'Loaded' if predictor.detector else 'Not loaded'}")
        print(f"  Classifier: {'Loaded' if predictor.classifier else 'Not loaded'}")
        print(f"  Species: {len(predictor.classes)} classes")
        print(f"  Caching: {'Enabled' if predictor.enable_caching else 'Disabled'}")
        print(f"\nModel Ready for Prediction!")
        
    except FileNotFoundError as e:
        print(f"\n❌ ERROR: Missing model files")
        print(f"   {e}")
        print(f"\n🛠️  To fix this:")
        print(f"   1. Train the classifier: python train_custom.py")
        print(f"   2. (Optional) Train detector: python train_mushroom_detector.py")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
