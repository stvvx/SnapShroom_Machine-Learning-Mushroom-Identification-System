"""
Custom Mushroom Classification Routes
Uses locally trained PyTorch model
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from custom_predict import create_predictor
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

toxicity_bp = Blueprint('toxicity_custom', __name__)

# Initialize predictor
try:
    predictor = create_predictor()
    logger.info("✅ Custom Mushroom Predictor initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize predictor: {e}")
    predictor = None


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
            logger.info(f"✅ Prediction successful: {result['classification']['label']}")
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
        "service": "Custom PyTorch Classifier",
        "model": "ResNet50",
        "num_classes": len(predictor.classes),
        "classes": predictor.classes,
        "model_path": predictor.model_path,
        "device": str(predictor.device),
        "note": "Trained on your custom mushroom dataset (mushroom10kinds)"
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
