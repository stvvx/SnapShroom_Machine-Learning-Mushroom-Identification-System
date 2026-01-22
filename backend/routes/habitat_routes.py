from flask import Blueprint, request, jsonify
from services.habitat_analyzer import analyze_habitat

habitat_bp = Blueprint("habitat", __name__)

@habitat_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    result = analyze_habitat(
        data["latitude"],
        data["longitude"],
        data["habitat_type"]
    )

    return jsonify(result)
