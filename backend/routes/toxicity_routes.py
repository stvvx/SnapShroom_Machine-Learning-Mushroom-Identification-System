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

toxicity_bp = Blueprint("toxicity", __name__)

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

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@toxicity_bp.route("/predict", methods=["POST"])
def comprehensive_prediction():
    """
    Comprehensive mushroom analysis combining all services.
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

        # Get optional context data
        context = request.json or {}
        location = context.get('location')
        current_date = context.get('date')
        user_context = context.get('user_context', {})

        # Run all analyses
        species_result = species_classifier.classify_species(image)
        toxicity_result = toxicity_detector.detect_toxicity(image)
        habitat_result = None
        if location:
            habitat_result = habitat_analyzer.analyze_habitat_suitability(
                species_result.get('scientific_name', ''),
                location,
                current_date
            )

        # Comprehensive risk assessment
        risk_assessment = risk_engine.assess_overall_risk(
            species_result,
            toxicity_result,
            habitat_result,
            user_context
        )

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

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        return jsonify(result)

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
        return jsonify(result)

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
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
