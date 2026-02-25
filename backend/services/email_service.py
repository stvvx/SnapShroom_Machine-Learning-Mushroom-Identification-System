# services/email_service.py
from flask_mail import Message
from flask import current_app
import logging
from html import escape

logger = logging.getLogger(__name__)


def send_prediction_email(user_email, user_name, prediction_result):
    """
    Send prediction result email to user after mushroom analysis.
    
    Args:
        user_email: User's email address
        user_name: User's display name
        prediction_result: Dictionary containing prediction results
    
    Returns:
        Boolean indicating success/failure
    """
    try:
        if not user_email:
            logger.warning("No email provided for sending prediction")
            return False
            
        logger.info(f"Attempting to send prediction email to {user_email}")
        
        # Extract prediction data
        species_info = prediction_result.get('image_analysis', {}).get('species', {})
        toxicity_info = prediction_result.get('image_analysis', {}).get('toxicity', {})
        risk_assessment = prediction_result.get('risk_assessment', {})
        recommendations = prediction_result.get('recommendations', [])
        safety_actions = prediction_result.get('safety_actions', [])
        
        species_name = species_info.get('species_name', 'Unknown')
        edibility = toxicity_info.get('toxicity_status', 'Unknown')
        confidence = species_info.get('confidence', 0)
        risk_level = risk_assessment.get('overall_risk_level', 'Unknown')
        
        # Build HTML email content
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }}
                    .section {{ background: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; }}
                    .result-box {{ background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                    .success {{ border-left-color: #4CAF50; }}
                    .warning {{ border-left-color: #ff9800; }}
                    .danger {{ border-left-color: #f44336; }}
                    .label {{ font-weight: bold; color: #667eea; }}
                    .value {{ margin-left: 10px; }}
                    ul {{ margin: 10px 0; padding-left: 20px; }}
                    li {{ margin: 5px 0; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍄 SnapShroom Prediction Results</h1>
                    </div>
                    
                    <p>Hello {escape(user_name)},</p>
                    <p>Your mushroom analysis is complete! Here are the results:</p>
                    
                    <div class="section" style="background: white; border: 2px solid #667eea;">
                        <h2 style="color: #667eea; margin-top: 0;">📊 Analysis Results</h2>
                        
                        <div class="result-box">
                            <span class="label">Mushroom Species:</span>
                            <span class="value">{escape(species_name)}</span>
                        </div>
                        
                        <div class="result-box">
                            <span class="label">Confidence Level:</span>
                            <span class="value">{confidence:.1%}</span>
                        </div>
                        
                        <div class="result-box">
                            <span class="label">Edibility Status:</span>
                            <span class="value">{escape(edibility)}</span>
                        </div>
                        
                        <div class="result-box">
                            <span class="label">Overall Risk Level:</span>
                            <span class="value">{escape(risk_level)}</span>
                        </div>
                    </div>
                    
                    {'<div class="section warning"><h3>⚠️ Recommendations</h3><ul>' + ''.join(f'<li>{escape(rec)}</li>' for rec in recommendations) + '</ul></div>' if recommendations else ''}
                    
                    {'<div class="section danger"><h3>🚨 Safety Actions</h3><ul>' + ''.join(f'<li>{escape(action)}</li>' for action in safety_actions) + '</ul></div>' if safety_actions else ''}
                    
                    <div class="section" style="background: #e3f2fd; border-left-color: #2196F3;">
                        <h3 style="color: #2196F3; margin-top: 0;">ℹ️ Important Notice</h3>
                        <p>This analysis is provided for informational purposes only. Always consult with a professional mycologist before consuming any wild mushrooms. Never rely solely on automated identification for food safety decisions.</p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 SnapShroom. All rights reserved.</p>
                        <p>This email was sent to {escape(user_email)} from our mushroom identification system.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create and send email
        msg = Message(
            subject=f"🍄 Mushroom Identification: {species_name}",
            recipients=[user_email],
            html=html_content
        )
        
        # Send with Flask-Mail
        mail = current_app.extensions.get('mail')
        if mail:
            mail.send(msg)
            logger.info(f"Prediction email sent successfully to {user_email}")
            return True
        else:
            logger.error("Mail extension not initialized")
            return False
        
    except Exception as e:
        logger.error(f"Failed to send prediction email to {user_email}: {str(e)}")
        return False


def send_alert_email(user_email, user_name, alert_type, alert_message):
    """
    Send an alert email for high-risk predictions.
    
    Args:
        user_email: User's email address
        user_name: User's display name
        alert_type: Type of alert (e.g., 'toxic', 'rare', 'dangerous')
        alert_message: Detailed alert message
    
    Returns:
        Boolean indicating success/failure
    """
    try:
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .alert-header {{ background: #f44336; color: white; padding: 20px; border-radius: 5px; text-align: center; }}
                    .alert-content {{ background: #ffebee; border: 2px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 5px; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="alert-header">
                        <h1>🚨 ALERT: High-Risk Mushroom Detection</h1>
                    </div>
                    
                    <p>Hello {escape(user_name)},</p>
                    
                    <div class="alert-content">
                        <h2 style="color: #f44336;">⚠️ Alert Type: {escape(alert_type).upper()}</h2>
                        <p>{escape(alert_message)}</p>
                    </div>
                    
                    <p style="color: #d32f2f; font-weight: bold;">
                        DO NOT consume this mushroom. Please seek professional advice before proceeding.
                    </p>
                    
                    <div class="footer">
                        <p>© 2026 SnapShroom. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        msg = Message(
            subject=f"🚨 ALERT: {alert_type.upper()} Mushroom Detected",
            recipients=[user_email],
            html=html_content
        )
        
        # Send with Flask-Mail
        mail = current_app.extensions.get('mail')
        if mail:
            mail.send(msg)
            logger.info(f"Alert email sent to {user_email}")
            return True
        else:
            logger.error("Mail extension not initialized")
            return False
        
    except Exception as e:
        logger.error(f"Failed to send alert email to {user_email}: {str(e)}")
        return False
