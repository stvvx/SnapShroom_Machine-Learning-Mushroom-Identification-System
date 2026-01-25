from flask import Blueprint, request, jsonify
from services.species_classifier import predict_species
from utils.json_encoder import safe_jsonify

species_bp = Blueprint("species", __name__)

@species_bp.route("/classify", methods=["POST"])
def classify_species():
    data = request.json
    features = data.get("features")

    species = predict_species(features)

    return safe_jsonify({
        "species": species
    })
