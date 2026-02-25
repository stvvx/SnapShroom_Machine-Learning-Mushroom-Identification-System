"""
Custom Mushroom Classification Routes
Uses locally trained PyTorch model
"""

import sys
import os

print("[ROUTE] 1. Starting toxicity routes import...", file=sys.stderr, flush=True)

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
import logging

print("[ROUTE] 2. Imported Flask...", file=sys.stderr, flush=True)

from custom_predict import create_predictor
from services.notification_service import NotificationService
from services.email_service import send_prediction_email, send_alert_email

print("[ROUTE] 3. Importing create_predictor...", file=sys.stderr, flush=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("[ROUTE] 4. Created blueprint...", file=sys.stderr, flush=True)

toxicity_bp = Blueprint('toxicity_custom', __name__)

print("[ROUTE] 5. Starting predictor initialization...", file=sys.stderr, flush=True)

# Initialize predictor
try:
    print("[ROUTE] 6. Creating predictor instance...", file=sys.stderr, flush=True)
    predictor = create_predictor()
    print("[ROUTE] 7. Predictor created successfully!", file=sys.stderr, flush=True)
    logger.info("[OK] Custom Mushroom Predictor initialized")
except Exception as e:
    print(f"[ROUTE] ERROR creating predictor: {e}", file=sys.stderr, flush=True)
    logger.error(f"[ERROR] Failed to initialize predictor: {e}")
    import traceback
    traceback.print_exc(file=sys.stderr)
    logger.error(f"Full traceback: {traceback.format_exc()}")
    predictor = None

print("[ROUTE] 8. Finished predictor initialization", file=sys.stderr, flush=True)


@toxicity_bp.route('/predict', methods=['POST'])
def predict_mushroom():
    """
    Classify mushroom from image using custom trained model.
    
    Request body:
    {
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    
    Response:
    {
        "success": true,
        "detection": {
            "found": true,
            "confidence": 0.95
        },
        "classification": {
            "label": "White Oyster Mushroom",
            "confidence": 0.92,
            "top_predictions": [...],
            "toxicity_level": "SAFE"
        }
    }
    """
    if not predictor:
        return jsonify({
            "success": False,
            "error": "Predictor not initialized. Train the model first using: python train_custom.py"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        image_base64 = data.get('image_base64')
        
        if not image_base64:
            return jsonify({
                "success": False,
                "error": "No image_base64 provided"
            }), 400
        
        logger.info("Processing mushroom classification...")
        
        # Run prediction
        result = predictor.predict(image_base64)
        
        # Save scan to database
        try:
            mongo = current_app.mongo
            
            # Get user ID if authenticated (optional)
            user_id = None
            try:
                user_id = get_jwt_identity()
            except:
                pass  # Not authenticated, proceed without user_id
            
            # Get location data from request if provided
            location_data = data.get('location', {})
            
            # Get image URL (Cloudinary URL) from request if provided
            image_url = data.get('image_url') or data.get('cloudinary_url')
            
            # Prepare scan data
            scan_data = {
                "user_id": ObjectId(user_id) if user_id else None,
                "mushroom_detected": result.get('detection', {}).get('found', False),
                "detection_confidence": result.get('detection', {}).get('confidence', 0),
                "mushroom_type": result.get('classification', {}).get('label') if result.get('classification') else None,
                "classification_confidence": result.get('classification', {}).get('confidence', 0) if result.get('classification') else None,
                "edibility": result.get('classification', {}).get('toxicity_level', '').lower() if result.get('classification') else None,
                "image_url": image_url,  # Store Cloudinary URL
                "location": {
                    "region": location_data.get('region'),
                    "province": location_data.get('province'),
                    "city": location_data.get('city')
                } if location_data else None,
                "created_at": datetime.utcnow(),
                "success": result.get("success", False)
            }
            
            # Insert scan record
            mongo.db.mushroom_scans.insert_one(scan_data)
            logger.info("✅ Scan data saved to database")
            
            # Send notification to user about scan result
            if user_id:
                try:
                    mushroom_name = result.get('classification', {}).get('label', 'Unknown') if result.get('classification') else 'Unknown'
                    edibility = result.get('classification', {}).get('toxicity_level', 'unknown').lower() if result.get('classification') else 'unknown'
                    NotificationService.notify_mushroom_scan(mongo, user_id, mushroom_name, edibility)
                except Exception as notif_err:
                    logger.warning(f"⚠️ Failed to send scan notification: {notif_err}")
            
        except Exception as db_error:
            logger.warning(f"⚠️ Failed to save scan to database: {str(db_error)}")
            # Continue even if saving fails
        
        # Log result
        if result.get("success"):
            detection = result.get('detection', {})
            classification = result.get('classification')
            
            if detection.get('found'):
                if classification:
                    logger.info(f"✅ Mushroom detected & classified: {classification['label']}")
                else:
                    logger.info(f"✅ Mushroom detected (confidence: {detection['confidence']})")
            else:
                logger.info(f"⚠️ No mushroom detected in image (confidence: {detection['confidence']})")
        else:
            logger.error(f"❌ Prediction failed: {result.get('error')}")
        
        # Send email with prediction results (if user email provided)
        user_email = data.get('user_email')
        user_name = data.get('user_name', 'User')

        logger.info(f"DEBUG: User email from context: {user_email}")
        logger.info(f"DEBUG: User name from context: {user_name}")

        if user_email:
            try:
                classification = result.get('classification') or {}
                toxicity_level = (classification.get('toxicity_level') or '').lower()

                if toxicity_level in ['dangerous', 'toxic', 'poisonous', 'deadly']:
                    toxicity_status = 'POISONOUS'
                    risk_level = 'high'
                    recommendations = [
                        'Do NOT consume this mushroom',
                        'Seek expert identification if uncertain',
                        'Contact poison control if ingested'
                    ]
                    safety_actions = [
                        'IMMEDIATELY AVOID consumption',
                        'Seek medical help if ingested'
                    ]
                elif toxicity_level in ['safe', 'edible', 'non_toxic']:
                    toxicity_status = 'EDIBLE'
                    risk_level = 'low'
                    recommendations = [
                        'Verify identification with a local expert',
                        'Consider habitat and season before consuming',
                        'Cook properly if edible'
                    ]
                    safety_actions = ['Safe if properly identified and cooked']
                else:
                    toxicity_status = 'Unknown'
                    risk_level = 'unknown'
                    recommendations = ['Use caution and seek expert identification']
                    safety_actions = ['Do not consume unless verified by expert']

                email_payload = {
                    "image_analysis": {
                        "species": {
                            "species_name": classification.get('label', 'Unknown'),
                            "confidence": classification.get('confidence', 0)
                        },
                        "toxicity": {
                            "toxicity_status": toxicity_status
                        }
                    },
                    "risk_assessment": {
                        "overall_risk_level": risk_level
                    },
                    "recommendations": recommendations,
                    "safety_actions": safety_actions
                }

                logger.info(f"DEBUG: Attempting to send email to {user_email}")
                email_sent = send_prediction_email(user_email, user_name, email_payload)
                result["email_sent"] = email_sent

                if risk_level in ['high', 'critical', 'extreme']:
                    send_alert_email(
                        user_email,
                        user_name,
                        "high_risk_detection",
                        "This mushroom has been flagged as potentially dangerous."
                    )

                logger.info(f"DEBUG: Email send result: {email_sent}")
            except Exception as email_error:
                logger.exception(f"Email sending error: {str(email_error)}")
                result["email_sent"] = False
                result["email_error"] = str(email_error)
        else:
            result["email_sent"] = False
            result["note"] = "No email provided. Results not sent."

        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"❌ Error in /predict: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Prediction error: {str(e)}"
        }), 500


@toxicity_bp.route('/scans/history', methods=['GET'])
def get_scan_history():
    """
    Get scan history with optional scope filtering.
    Query params:
        - user_id: Filter by specific user (optional, legacy)
        - scope: 'mine' = current user's scans, 'universe' = everyone else's scans (optional)
        - limit: Max number of records (default: 50)
    Requires JWT for scope=mine or scope=universe.
    """
    try:
        mongo = current_app.mongo
        
        # Get query parameters
        user_id = request.args.get('user_id')
        scope = request.args.get('scope')  # 'mine' or 'universe'
        limit = int(request.args.get('limit', 50))
        
        # Build query
        query = {}
        
        # If scope is provided, resolve current user from JWT
        if scope in ('mine', 'universe'):
            current_user_id = None
            try:
                from flask_jwt_extended import get_jwt_identity
                current_user_id = get_jwt_identity()
            except Exception:
                pass
            
            if current_user_id:
                if scope == 'mine':
                    query['user_id'] = ObjectId(current_user_id)
                elif scope == 'universe':
                    query['user_id'] = {'$ne': ObjectId(current_user_id)}
        elif user_id:
            # Legacy: filter by explicit user_id param
            try:
                query['user_id'] = ObjectId(user_id)
            except Exception:
                query['user_id'] = None
        
        # Fetch scans sorted by most recent first
        scans = list(mongo.db.mushroom_scans.find(query)
                    .sort('created_at', -1)
                    .limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for scan in scans:
            scan['_id'] = str(scan['_id'])
            if scan.get('user_id'):
                scan['user_id'] = str(scan['user_id'])
        
        # Look up usernames for scans (for universe view)
        if scope == 'universe':
            user_ids = set()
            for scan in scans:
                uid = scan.get('user_id')
                if uid:
                    user_ids.add(uid)
            # Batch fetch usernames
            user_map = {}
            if user_ids:
                users_cursor = mongo.db.users.find(
                    {"_id": {"$in": [ObjectId(uid) for uid in user_ids]}},
                    {"_id": 1, "username": 1, "name": 1}
                )
                for u in users_cursor:
                    user_map[str(u["_id"])] = u.get("name") or u.get("username") or "Unknown"
            for scan in scans:
                uid = scan.get('user_id')
                scan['scanned_by'] = user_map.get(uid, 'Anonymous') if uid else 'Anonymous'
        
        return jsonify({
            "success": True,
            "count": len(scans),
            "scans": scans
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching scan history: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@toxicity_bp.route('/health', methods=['GET'])
def health_check():
    """Check if custom classifier service is running."""
    return jsonify({
        "status": "healthy" if predictor else "misconfigured",
        "service": "custom-pytorch-classifier",
        "timestamp": datetime.now().isoformat()
    }), 200


@toxicity_bp.route('/info', methods=['GET'])
def service_info():
    """Get service information."""
    if not predictor:
        return jsonify({
            "configured": False,
            "error": "Predictor not initialized. Train the model first."
        }), 500
    
    return jsonify({
        "configured": True,
        "service": "🍄 Two-Stage Mushroom Detector + Classifier",
        "stage_1": {
            "name": "Mushroom Detection",
            "model": "ResNet50 (Binary Classification)",
            "path": "models/mushroom_detector.pth",
            "output": "Mushroom or Not Mushroom"
        },
        "stage_2": {
            "name": "Mushroom Classification",
            "model": "ResNet50 (Multi-class)",
            "path": "models/mushroom_classifier.pth",
            "num_classes": len(predictor.classes),
            "classes": predictor.classes
        },
        "device": str(predictor.device),
        "note": "Trained on Roboflow dataset with 8 mushroom types"
    }), 200


@toxicity_bp.route('/classes', methods=['GET'])
def get_classes():
    """Get list of all mushroom classes the model can classify."""
    if not predictor:
        return jsonify({
            "success": False,
            "error": "Predictor not initialized"
        }), 500
    
    return jsonify({
        "success": True,
        "classes": predictor.classes,
        "count": len(predictor.classes)
    }), 200
