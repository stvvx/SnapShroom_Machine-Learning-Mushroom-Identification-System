from flask import Blueprint, request, jsonify
from services.risk_engine import assess_risk

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/assess", methods=["POST"])
def assess():
    data = request.json

    result = assess_risk(
        data["species"],
        data["toxicity"],
        data["habitat_risk"]
    )

    return jsonify(result)
