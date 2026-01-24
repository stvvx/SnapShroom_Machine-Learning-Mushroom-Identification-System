from flask import Flask
from flask_cors import CORS
import os
from config import get_config

def create_app(config_name='development'):
    app = Flask(__name__)

    # Load configuration
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)

    # Enable CORS
    CORS(app, origins=config_obj.CORS_ORIGINS)

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['MODEL_PATH'], exist_ok=True)

    # Register blueprints
    from routes.dataset_routes import dataset_bp
    from routes.species_routes import species_bp
    from routes.toxicity_routes import toxicity_bp
    from routes.habitat_routes import habitat_bp
    from routes.risk_routes import risk_bp

    app.register_blueprint(dataset_bp, url_prefix="/api/dataset")
    app.register_blueprint(species_bp, url_prefix="/api/species")
    app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
    app.register_blueprint(habitat_bp, url_prefix="/api/habitat")
    app.register_blueprint(risk_bp, url_prefix="/api/risk")

    # Health check endpoint
    @app.route("/")
    def home():
        return {
            "status": "SnapShroom backend running",
            "version": "1.0",
            "models_available": {
                "species_model": os.path.exists(app.config['SPECIES_MODEL_PATH']),
                "toxicity_model": os.path.exists(app.config['TOXICITY_MODEL_PATH']),
                "pytorch_model": os.path.exists(app.config['PYTORCH_MODEL_PATH'])
            }
        }

    return app

# Create app instance
app = create_app()

if __name__ == "__main__":
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
