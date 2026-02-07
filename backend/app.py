from dotenv import load_dotenv
import os

load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager

import sys

import cloudinary.uploader
import cloudinary_config   # this activates config


# ==================================================
# LOAD ENV VARIABLES
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
sys.path.append(BASE_DIR)

from config import get_config

# ==================================================
# EXTENSIONS
# ==================================================
mongo = PyMongo()
jwt = JWTManager()


def create_app(config_name="development"):
    app = Flask(__name__)

    # ==================================================
    # CONFIG
    # ==================================================
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)

    app.config["MONGO_URI"] = os.getenv(
        "DB_URI", app.config.get("MONGO_URI")
    )
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", app.config.get("JWT_SECRET_KEY")
    )
    app.config["SECRET_KEY"] = os.getenv(
        "SECRET_KEY", app.config.get("SECRET_KEY")
    )

    # ==================================================
    # CORS (FIXED)
    # ==================================================
    allowed_origins = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://192.168.100.26:8081",
        "https://ruthie-unablative-amiya.ngrok-free.dev"
    ]
    
    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Access-Control-Allow-Credentials",
            "X-Forwarded-Proto",
            "ngrok-skip-browser-warning"
        ],
        expose_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=["GET", "POST", "PUT", "DELETE"],
        max_age=3600
    )



    # ==================================================
    # INIT EXTENSIONS
    # ==================================================
    mongo.init_app(app)
    jwt.init_app(app)

    # 🔥 expose mongo globally
    app.mongo = mongo

    # ==================================================
    # TEST DB
    # ==================================================
    with app.app_context():
        try:
            mongo.db.command("ping")
            print("✅ MongoDB connected")
            init_database(mongo.db)
        except Exception as e:
            print("⚠️ MongoDB warning:", e)

    # ==================================================
    # FOLDERS
    # ==================================================
    for folder in [
        app.config.get("UPLOAD_FOLDER", "uploads"),
        app.config.get("MODEL_PATH", "models"),
        app.config.get("DATASET_PATH", "datasets"),
        "logs",
    ]:
        os.makedirs(folder, exist_ok=True)

    # ==================================================
    # BLUEPRINTS
    # ==================================================
    register_blueprints(app)

    # ==================================================
    # ROUTES
    # ==================================================
    @app.route("/")
    def home():
        return {"status": "SnapShroom backend running"}

    @app.route("/api/health")
    def health():
        try:
            mongo.db.command("ping")
            return {"status": "healthy"}, 200
        except:
            return {"status": "unhealthy"}, 503

    @app.route("/upload", methods=["POST"])
    def upload():
        file = request.files["image"]

        result = cloudinary.uploader.upload(file)

        return {
            "url": result["secure_url"]
        }

    # ==================================================
    # ERRORS
    # ==================================================
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Server Error", "detail": str(e)}), 500

    print("✅ SnapShroom API initialized")
    return app


# ==================================================
# DATABASE INIT
# ==================================================
def init_database(db):
    if "users" not in db.list_collection_names():
        db.create_collection("users")

    users = db.users
    users.create_index("email", unique=True)
    users.create_index("username", unique=True)
    users.create_index("password")
    users.create_index("created_at")

    print("✅ Database ready")


# ==================================================
# BLUEPRINTS
# ==================================================
def register_blueprints(app):
    try:
        from routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        print("✅ Auth routes loaded")
    except Exception as e:
        print("⚠️ Blueprint error:", e)
    
    try:
        from routes.admin_routes import admin_bp
        app.register_blueprint(admin_bp, url_prefix="/api/admin")
        print("✅ Admin routes loaded")
    except Exception as e:
        print("⚠️ Admin blueprint error:", e)
    
    try:
        from routes.toxicity_routes_custom import toxicity_bp
        app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
        print("✅ Toxicity/Detection routes loaded (Custom Model)")
    except Exception as e:
        print("⚠️ Toxicity blueprint error:", e)


# ==================================================
# RUN
# ==================================================
app = create_app()

if __name__ == "__main__":
    cfg = get_config(os.getenv("FLASK_ENV", "development"))
    app.run(
        host=cfg.HOST,
        port=cfg.PORT,
        debug=False,  # Disable debug mode to prevent socket errors on Windows
        threaded=True,
        use_reloader=False,  # Disable reloader to prevent threading issues
    )