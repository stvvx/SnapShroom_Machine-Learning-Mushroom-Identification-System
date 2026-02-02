"""
Updated Toxicity Routes using Roboflow-trained models.
Replaces old predict.py and detect_mushroom.py with unified Roboflow approach.
"""
from flask import Blueprint, request, jsonify
from roboflow_unified_predict import RoboflowUnifiedPredictor, predict_mushroom_edibility
from PIL import Image
import io
import base64
import os
from utils.json_encoder import safe_jsonify

toxicity_bp = Blueprint("toxicity", __name__)

# Initialize predictor (lazy load on first request)
_predictor = None

def get_predictor():
    """Lazy load predictor to avoid startup delays."""
    global _predictor
    if _predictor is None:
        detection_model = os.getenv("DETECTION_MODEL_PATH", "models/detection.pt")
        classification_model = os.getenv("CLASSIFICATION_MODEL_PATH", "models/classification.pt")
        
        if not os.path.exists(detection_model) or not os.path.exists(classification_model):
            raise FileNotFoundError(
                f"Models not found. Ensure models are exported from Roboflow:\n"
                f"  Detection: {detection_model}\n"
                f"  Classification: {classification_model}"
            )
        
        _predictor = RoboflowUnifiedPredictor(detection_model, classification_model)
    
    return _predictor

@toxicity_bp.route("/predict", methods=["POST"])
def predict_toxicity():
    """
    Unified endpoint: Detect mushrooms AND classify edibility.
    
    Request:
    - image: multipart file OR
    - image_base64: base64 encoded image
    
    Response:
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
                "recommendation": "✅ Safe to eat"
            }
        ]
    }
    """
    try:
        # Get image
        image_path = None
        
        if 'image' in request.files:
            image_file = request.files['image']
            # Save temporarily
            image_path = f"uploads/temp_{image_file.filename}"
            os.makedirs("uploads", exist_ok=True)
            image_file.save(image_path)
        
        elif request.json and 'image_base64' in request.json:
            # Handle base64
            image_base64 = request.json['image_base64']
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            image_path = "uploads/temp_base64.jpg"
            os.makedirs("uploads", exist_ok=True)
            image.save(image_path)
        
        else:
            return jsonify({"status": "error", "message": "No image provided"}), 400
        
        # Run prediction
        predictor = get_predictor()
        result = predictor.predict(image_path)
        
        # Clean up temp file
        if os.path.exists(image_path):
            os.remove(image_path)
        
        return safe_jsonify(result), 200
    
    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@toxicity_bp.route("/detect-and-classify", methods=["POST"])
def detect_and_classify():
    """
    Advanced endpoint with more options.
    
    JSON Params:
    - image_base64: Image as base64
    - confidence_threshold: Min confidence (default 0.5)
    - return_crops: Include cropped regions (default false)
    """
    try:
        if 'image_base64' not in request.json:
            return jsonify({"error": "No image_base64 provided"}), 400
        
        # Get options
        confidence = request.json.get('confidence_threshold', 0.5)
        return_crops = request.json.get('return_crops', False)
        
        # Decode image
        image_base64 = request.json['image_base64']
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Save temporarily
        image_path = "uploads/temp_advanced.jpg"
        os.makedirs("uploads", exist_ok=True)
        image.save(image_path)
        
        # Predict
        predictor = get_predictor()
        result = predictor.predict(image_path, confidence, return_crops)
        
        # Clean up
        if os.path.exists(image_path):
            os.remove(image_path)
        
        return safe_jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@toxicity_bp.route("/health", methods=["GET"])
def health_check():
    """Check if models are loaded and ready."""
    try:
        detection_model = os.getenv("DETECTION_MODEL_PATH", "models/detection.pt")
        classification_model = os.getenv("CLASSIFICATION_MODEL_PATH", "models/classification.pt")
        
        detection_exists = os.path.exists(detection_model)
        classification_exists = os.path.exists(classification_model)
        
        return jsonify({
            "status": "ok" if (detection_exists and classification_exists) else "missing_models",
            "detection_model": {
                "path": detection_model,
                "exists": detection_exists
            },
            "classification_model": {
                "path": classification_model,
                "exists": classification_exists
            }
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
