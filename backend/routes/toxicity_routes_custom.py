"""
Custom Mushroom Classification Routes
Uses locally trained PyTorch model
"""

import sys
import os

print("[ROUTE] 1. Starting toxicity routes import...", file=sys.stderr, flush=True)

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

print("[ROUTE] 2. Imported Flask...", file=sys.stderr, flush=True)

from custom_predict import create_predictor

print("[ROUTE] 3. Importing create_predictor...", file=sys.stderr, flush=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("[ROUTE] 4. Created blueprint...", file=sys.stderr, flush=True)

toxicity_bp = Blueprint('toxicity_custom', __name__)

print("[ROUTE] 5. Starting predictor initialization...", file=sys.stderr, flush=True)

# Initialize predictor
try:
    print("[ROUTE] 6. Creating predictor instance...", file=sys.stderr, flush=True)
    predictor = create_predictor()
    print("[ROUTE] 7. Predictor created successfully!", file=sys.stderr, flush=True)
    logger.info("[OK] Custom Mushroom Predictor initialized")
except Exception as e:
    print(f"[ROUTE] ERROR creating predictor: {e}", file=sys.stderr, flush=True)
    logger.error(f"[ERROR] Failed to initialize predictor: {e}")
    import traceback
    traceback.print_exc(file=sys.stderr)
    logger.error(f"Full traceback: {traceback.format_exc()}")
    predictor = None

print("[ROUTE] 8. Finished predictor initialization", file=sys.stderr, flush=True)


@toxicity_bp.route('/predict', methods=['POST'])
def predict_mushroom():
    """
    Classify mushroom from image using custom trained model.
    
    Request body:
    {
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    
    Response:
    {
        "success": true,
        "detection": {
            "found": true,
            "confidence": 0.95
        },
        "classification": {
            "label": "White Oyster Mushroom",
            "confidence": 0.92,
            "top_predictions": [...],
            "toxicity_level": "SAFE"
        }
    }
    """
    if not predictor:
        return jsonify({
            "success": False,
            "error": "Predictor not initialized. Train the model first using: python train_custom.py"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        image_base64 = data.get('image_base64')
        
        if not image_base64:
            return jsonify({
                "success": False,
                "error": "No image_base64 provided"
            }), 400
        
        logger.info("Processing mushroom classification...")
        
        # Run prediction
        result = predictor.predict(image_base64)
        
        # Log result
        if result.get("success"):
            detection = result.get('detection', {})
            classification = result.get('classification')
            
            if detection.get('found'):
                if classification:
                    logger.info(f"✅ Mushroom detected & classified: {classification['label']}")
                else:
                    logger.info(f"✅ Mushroom detected (confidence: {detection['confidence']})")
            else:
                logger.info(f"⚠️ No mushroom detected in image (confidence: {detection['confidence']})")
        else:
            logger.error(f"❌ Prediction failed: {result.get('error')}")
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"❌ Error in /predict: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Prediction error: {str(e)}"
        }), 500


@toxicity_bp.route('/health', methods=['GET'])
def health_check():
    """Check if custom classifier service is running."""
    return jsonify({
        "status": "healthy" if predictor else "misconfigured",
        "service": "custom-pytorch-classifier",
        "timestamp": datetime.now().isoformat()
    }), 200


@toxicity_bp.route('/info', methods=['GET'])
def service_info():
    """Get service information."""
    if not predictor:
        return jsonify({
            "configured": False,
            "error": "Predictor not initialized. Train the model first."
        }), 500
    
    return jsonify({
        "configured": True,
        "service": "🍄 Two-Stage Mushroom Detector + Classifier",
        "stage_1": {
            "name": "Mushroom Detection",
            "model": "ResNet50 (Binary Classification)",
            "path": "models/mushroom_detector.pth",
            "output": "Mushroom or Not Mushroom"
        },
        "stage_2": {
            "name": "Mushroom Classification",
            "model": "ResNet50 (Multi-class)",
            "path": "models/mushroom_classifier.pth",
            "num_classes": len(predictor.classes),
            "classes": predictor.classes
        },
        "device": str(predictor.device),
        "note": "Trained on Roboflow dataset with 8 mushroom types"
    }), 200


@toxicity_bp.route('/classes', methods=['GET'])
def get_classes():
    """Get list of all mushroom classes the model can classify."""
    if not predictor:
        return jsonify({
            "success": False,
            "error": "Predictor not initialized"
        }), 500
    
    return jsonify({
        "success": True,
        "classes": predictor.classes,
        "count": len(predictor.classes)
    }), 200
