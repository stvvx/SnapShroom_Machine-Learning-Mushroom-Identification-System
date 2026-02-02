"""
Temporary Flask Routes: Detection-Only
Use this while classification model is training.
After classification model is ready, switch to toxicity_routes_roboflow.py
"""
from flask import Blueprint, request, jsonify
from roboflow_detection_only import RoboflowDetectionOnly, detect_mushrooms
from response_adapter import adapt_detection_to_prediction
from PIL import Image
import io
import base64
import os
from utils.json_encoder import safe_jsonify

toxicity_bp = Blueprint("toxicity", __name__)

# Initialize predictor (lazy load)
_detector = None

def get_detector():
    """Lazy load detector."""
    global _detector
    if _detector is None:
        detection_model = os.getenv("DETECTION_MODEL_PATH", "models/detection.pt")
        
        if not os.path.exists(detection_model):
            raise FileNotFoundError(
                f"Detection model not found: {detection_model}\n"
                f"Export from Roboflow and place here."
            )
        
        _detector = RoboflowDetectionOnly(detection_model)
    
    return _detector


@toxicity_bp.route("/predict", methods=["POST"])
def detect():
    """
    Detect mushrooms in image (detection-only, no classification yet).
    Response is adapted to match prediction screen expectations.
    
    Request:
    - image: multipart file OR
    - image_base64: base64 encoded image
    
    Response:
    {
        "timestamp": "...",
        "image_analysis": {
            "species": {...},
            "toxicity": {
                "toxicity_status": "⏳ PENDING CLASSIFICATION",
                ...
            },
            "habitat": {...}
        },
        "risk_assessment": {...},
        "recommendations": [...],
        "safety_actions": [...],
        "detections": [...]  ← Raw detection data
    }
    """
    try:
        image_path = None
        
        if 'image' in request.files:
            image_file = request.files['image']
            image_path = f"uploads/temp_{image_file.filename}"
            os.makedirs("uploads", exist_ok=True)
            image_file.save(image_path)
        
        elif request.json and 'image_base64' in request.json:
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
        
        # Run detection
        detector = get_detector()
        detection_result = detector.predict(image_path)
        
        # Adapt detection result to prediction screen format
        result = adapt_detection_to_prediction(detection_result)
        
        if not result:
            result = {
                "status": "error",
                "message": detection_result.get("message", "Detection failed")
            }
        
        # Clean up
        if os.path.exists(image_path):
            os.remove(image_path)
        
        return safe_jsonify(result), 200
    
    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@toxicity_bp.route("/health", methods=["GET"])
def health_check():
    """Check if detection model is ready."""
    try:
        detection_model = os.getenv("DETECTION_MODEL_PATH", "models/detection.pt")
        exists = os.path.exists(detection_model)
        
        return jsonify({
            "status": "ok" if exists else "missing_model",
            "detection_model": {
                "path": detection_model,
                "exists": exists
            },
            "note": "⏳ Classification model training. Check back soon!"
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
