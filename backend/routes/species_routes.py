from flask import Blueprint, request, jsonify
from services.species_classifier import predict_species

species_bp = Blueprint("species", __name__)

@species_bp.route("/classify", methods=["POST"])
def classify_species():
    data = request.json
    features = data.get("features")

    species = predict_species(features)

    return jsonify({
        "species": species
    })
