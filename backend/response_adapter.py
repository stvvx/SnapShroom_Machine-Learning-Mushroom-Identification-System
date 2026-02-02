"""
Response Adapter: Convert detection-only response to prediction screen format
"""

def adapt_detection_to_prediction(detection_result):
    """
    Convert detection-only response to format prediction screen expects.
    
    Input (detection-only):
    {
        "status": "success",
        "total_detections": 2,
        "mushrooms": [
            {"id": 0, "confidence": 0.95, "class": "mushroom", ...}
        ]
    }
    
    Output (prediction screen format):
    {
        "timestamp": "...",
        "image_analysis": {
            "species": {...},
            "toxicity": {...},
            "habitat": {...}
        },
        "risk_assessment": {...},
        "recommendations": [...],
        "safety_actions": [...]
    }
    """
    
    if detection_result.get("status") != "success":
        return None
    
    total = detection_result.get("total_detections", 0)
    mushrooms = detection_result.get("mushrooms", [])
    
    # Build response
    return {
        "timestamp": detection_result.get("timestamp", ""),
        "image_analysis": {
            "species": {
                "identified_species": "Mushroom (under detection)" if total > 0 else "Unknown",
                "common_name": "Detected Mushroom",
                "scientific_name": f"Detected ({total} found)",
                "confidence_score": mushrooms[0]["confidence"] if mushrooms else 0,
                "description": f"Detected {total} mushroom(s) in image. Awaiting classification.",
            },
            "toxicity": {
                "toxicity_status": "⏳ PENDING CLASSIFICATION",
                "edibility_status": "Unknown",
                "confidence_score": 0,
                "toxic_compounds": [],
                "health_effects": ["Awaiting classification model training"],
            },
            "habitat": {
                "optimal_habitat": "Various",
                "growth_conditions": ["Detection only - awaiting classification"],
                "geographic_distribution": ["Global"],
            }
        },
        "risk_assessment": {
            "risk_level": "pending",
            "overall_risk_score": 50,
            "risk_factors": [
                "Classification model training in progress",
                f"Detected {total} mushroom(s) awaiting edibility classification"
            ],
        },
        "recommendations": [
            f"✅ Detected {total} mushroom(s) in image",
            "⏳ Classification model is training - will provide edibility info soon",
            "🔄 Check back after classification model training completes",
        ],
        "safety_actions": [
            "DO NOT CONSUME - awaiting classification",
            "Wait for full detection + classification system",
        ],
        "detections": mushrooms,  # Raw detection data
    }
