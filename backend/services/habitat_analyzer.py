def analyze_habitat(latitude, longitude, habitat_type):
    """
    Rule-based placeholder for habitat analysis.
    """
    risk = "Low"

    if habitat_type.lower() in ["industrial", "roadside", "dump"]:
        risk = "High"

    return {
        "habitat": habitat_type,
        "location_risk": risk
    }
