"""
Toxicity Detection Routes (Using Roboflow Cloud API - Free Tier)
No local model download required!
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from roboflow_api_predict import create_predictor
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

toxicity_bp = Blueprint('toxicity_roboflow', __name__)

# Initialize predictor
try:
    predictor = create_predictor()
    logger.info("✅ Roboflow API Predictor initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize predictor: {e}")
    predictor = None


@toxicity_bp.route('/predict', methods=['POST'])
def predict_mushroom():
    """
    Detect and classify mushroom from image.
    
    Request body:
    {
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    
    Response:
    {
        "success": true,
        "detection": {
            "found": true,
            "confidence": 0.95,
            "bounding_box": [x, y, width, height]
        },
        "classification": {
            "label": "EDIBLE",
            "confidence": 0.92,
            "toxicity_level": "SAFE"
        }
    }
    """
    if not predictor:
        return jsonify({
            "success": False,
            "error": "Predictor not initialized. Check Roboflow configuration."
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
        
        logger.info("Processing mushroom prediction...")
        
        # Run prediction
        result = predictor.predict(image_base64=image_base64)
        
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
    """Check if toxicity detection service is running."""
    return jsonify({
        "status": "healthy" if predictor else "misconfigured",
        "service": "roboflow-api-based",
        "timestamp": datetime.now().isoformat()
    }), 200


@toxicity_bp.route('/info', methods=['GET'])
def service_info():
    """Get service information."""
    if not predictor:
        return jsonify({
            "configured": False,
            "error": "Predictor not initialized"
        }), 500
    
    return jsonify({
        "configured": True,
        "service": "Roboflow Cloud API (Free Tier)",
        "detection_project": predictor.detection_project,
        "classification_project": predictor.classification_project,
        "api_endpoint": "https://detect.roboflow.com",
        "note": "Uses Roboflow's cloud inference - no local GPU needed!"
    }), 200
