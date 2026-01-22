from flask import Blueprint, request, jsonify
from services.toxicity_detector import detect_toxicity

toxicity_bp = Blueprint("toxicity", __name__)

@toxicity_bp.route("/detect", methods=["POST"])
def toxicity():
    data = request.json
    features = data.get("features")

    toxicity = detect_toxicity(features)

    return jsonify({
        "toxicity_status": toxicity
    })
