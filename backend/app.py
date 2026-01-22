from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    from routes.species_routes import species_bp
    from routes.toxicity_routes import toxicity_bp
    from routes.habitat_routes import habitat_bp
    from routes.risk_routes import risk_bp

    app.register_blueprint(species_bp, url_prefix="/api/species")
    app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
    app.register_blueprint(habitat_bp, url_prefix="/api/habitat")
    app.register_blueprint(risk_bp, url_prefix="/api/risk")

    return app

app = create_app()
@app.route("/")
def home():
    return {
        "status": "SnapShroom backend running",
        "version": "1.0"
    }


if __name__ == "__main__":
    app.run(debug=True)
