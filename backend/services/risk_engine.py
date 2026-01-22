def assess_risk(species_result, toxicity_result, habitat_result):
    """
    Decision support logic.
    """

    if toxicity_result["toxicity"] == "Poisonous":
        return {
            "risk_level": "High",
            "recommendation": "DO NOT CONSUME"
        }

    if habitat_result["location_risk"] == "High":
        return {
            "risk_level": "Medium",
            "recommendation": "Consumption not advised"
        }

    return {
        "risk_level": "Low",
        "recommendation": "Safe with caution"
    }
