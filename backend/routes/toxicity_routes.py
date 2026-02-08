from flask import Blueprint, request, jsonify
from services.toxicity_detector import toxicity_detector
from services.species_classifier import species_classifier
from services.habitat_analyzer import habitat_analyzer
from services.risk_engine import risk_engine
from PIL import Image
import io
import base64
from flask import current_app
import os
from utils.json_encoder import safe_jsonify, make_json_serializable

toxicity_bp = Blueprint("toxicity", __name__)

@toxicity_bp.route("/check-mushroom", methods=["POST"])
def check_mushroom_presence():
    """
    Quick check if image contains any mushroom.
    Returns: {exists: true/false, confidence: 0-1, message: string}
    """
    try:
        # Handle image
        image = None
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        elif request.json and 'image_base64' in request.json:
            try:
                image_base64 = request.json['image_base64']
                if ',' in image_base64:
                    image_base64 = image_base64.split(',')[1]
                image_data = base64.b64decode(image_base64)
                image = Image.open(io.BytesIO(image_data))
            except Exception as e:
                return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        else:
            return jsonify({"error": "No image provided. Send 'image' file or 'image_base64' in JSON."}), 400
        
        if image is None:
            return jsonify({"error": "Failed to load image"}), 400

        # Quick detection check
        try:
            detection_result = toxicity_detector.detect_toxicity(image)
            
            # Check if mushroom was detected
            detected = detection_result.get('detected', False)
            confidence = detection_result.get('confidence', 0)
            
            # Get count if available
            count = detection_result.get('mushroom_count', 0 if not detected else 1)
            
            return safe_jsonify({
                "exists": detected,
                "confidence": float(confidence),
                "count": count,
                "message": f"Found {count} mushroom(s)" if detected else "No mushroom detected in image"
            })
            
        except Exception as e:
            print(f"Detection error: {str(e)}")
            return safe_jsonify({
                "exists": False,
                "confidence": 0,
                "count": 0,
                "message": "Detection unavailable"
            }), 500
            
    except Exception as e:
        print(f"Check mushroom error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@toxicity_bp.route("/detect", methods=["POST"])
def detect_toxicity():
    """
    Detect toxicity from image upload.
    """
    try:
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        elif request.json and 'image_base64' in request.json:
            # Handle base64 encoded image
            image_data = base64.b64decode(request.json['image_base64'])
            image = Image.open(io.BytesIO(image_data))
        else:
            return jsonify({"error": "No image provided"}), 400

        # Detect toxicity
        result = toxicity_detector.detect_toxicity(image)

        return safe_jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@toxicity_bp.route("/predict", methods=["POST"])
def comprehensive_prediction():
    """
    Comprehensive mushroom analysis combining all services.
    """
    try:
        print("Received prediction request")
        
        # Handle image upload
        image = None
        if 'image' in request.files:
            print("Processing file upload")
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        elif request.json and 'image_base64' in request.json:
            print("Processing base64 image")
            try:
                image_base64 = request.json['image_base64']
                # Remove data URI prefix if present
                if ',' in image_base64:
                    image_base64 = image_base64.split(',')[1]
                
                print(f"Decoding base64 image (length: {len(image_base64)})")
                image_data = base64.b64decode(image_base64)
                print(f"Decoded image size: {len(image_data)} bytes")
                image = Image.open(io.BytesIO(image_data))
                print(f"Image opened: {image.size}, mode: {image.mode}")
            except Exception as e:
                print(f"Error processing base64 image: {str(e)}")
                return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        else:
            print("No image found in request")
            return jsonify({"error": "No image provided. Send 'image' file or 'image_base64' in JSON."}), 400
        
        if image is None:
            return jsonify({"error": "Failed to load image"}), 400

        # Get optional context data
        context = request.json or {}
        location = context.get('location')
        current_date = context.get('date')
        user_context = context.get('user_context', {})

        # Run all analyses
        print("Starting species classification...")
        species_result = species_classifier.classify_species(image)
        print(f"Species result: {species_result.get('species', 'unknown')}")
        
        print("Starting toxicity detection...")
        toxicity_result = toxicity_detector.detect_toxicity(image)
        print(f"Toxicity result: {toxicity_result.get('toxicity_status', 'unknown')}")
        
        habitat_result = None
        if location:
            print("Starting habitat analysis...")
            habitat_result = habitat_analyzer.analyze_habitat_suitability(
                species_result.get('scientific_name', ''),
                location,
                current_date
            )

        print("Starting risk assessment...")
        # Comprehensive risk assessment
        risk_assessment = risk_engine.assess_overall_risk(
            species_result,
            toxicity_result,
            habitat_result,
            user_context
        )
        print("Analysis complete")

        # Compile comprehensive response
        response = {
            "timestamp": risk_assessment.get("last_updated"),
            "image_analysis": {
                "species": species_result,
                "toxicity": toxicity_result,
                "habitat": habitat_result
            },
            "risk_assessment": risk_assessment,
            "recommendations": risk_assessment.get("recommendations", []),
            "safety_actions": risk_assessment.get("safety_actions", [])
        }

        # Convert to JSON-serializable format (handles pandas/numpy types)
        return safe_jsonify(response)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in comprehensive_prediction: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": str(e),
            "details": error_trace if current_app.config.get('DEBUG') else None
        }), 500

@toxicity_bp.route("/species", methods=["POST"])
def classify_species():
    """
    Classify mushroom species from image.
    """
    try:
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        elif request.json and 'image_base64' in request.json:
            image_data = base64.b64decode(request.json['image_base64'])
            image = Image.open(io.BytesIO(image_data))
        else:
            return jsonify({"error": "No image provided"}), 400

        result = species_classifier.classify_species(image)
        return safe_jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@toxicity_bp.route("/habitat", methods=["POST"])
def analyze_habitat():
    """
    Analyze habitat suitability.
    """
    try:
        data = request.json
        species_name = data.get('species_name', '')
        location = data.get('location')
        current_date = data.get('date')

        result = habitat_analyzer.analyze_habitat_suitability(
            species_name, location, current_date
        )
        return safe_jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@toxicity_bp.route("/risk", methods=["POST"])
def assess_risk():
    """
    Comprehensive risk assessment.
    """
    try:
        data = request.json
        species_result = data.get('species_result', {})
        toxicity_result = data.get('toxicity_result', {})
        habitat_result = data.get('habitat_result')
        user_context = data.get('user_context', {})

        result = risk_engine.assess_overall_risk(
            species_result, toxicity_result, habitat_result, user_context
        )
        return safe_jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
