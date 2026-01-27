from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
import os
import sys

# Load environment variables FIRST
from dotenv import load_dotenv

# Load .env file from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import get_config
from utils.json_encoder import JSONEncoder

# Initialize extensions (no app yet)
mongo = PyMongo()
jwt = JWTManager()

def create_app(config_name='development'):
    app = Flask(__name__)

    # Use custom JSON encoder for pandas/numpy types
    app.json_encoder = JSONEncoder

    # Load configuration
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)

    # Override with environment variables if they exist
    if os.getenv('DB_URI'):
        app.config['MONGO_URI'] = os.getenv('DB_URI')
    
    if os.getenv('JWT_SECRET_KEY'):
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    
    if os.getenv('SECRET_KEY'):
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

    # Enable CORS
    CORS(app, origins=config_obj.CORS_ORIGINS, supports_credentials=True)

    # Initialize extensions with app
    try:
        mongo.init_app(app)
        jwt.init_app(app)
        
        # Test MongoDB connection
        with app.app_context():
            try:
                # Test the connection
                mongo.db.command('ping')
                print(f"✅ Connected to MongoDB database: {app.config['MONGO_DBNAME']}")
                
                # Initialize collections and indexes
                init_database(mongo.db)
                
            except Exception as e:
                print(f"⚠️  MongoDB connection warning: {str(e)}")
                print(f"   MONGO_URI: {app.config.get('MONGO_URI', 'Not set')}")
                print(f"   This may be temporary. The connection will be checked at runtime.")
            
    except Exception as e:
        print(f"❌ Extension initialization failed: {str(e)}")
        raise

    # Make mongo accessible everywhere
    app.mongo = mongo

    # Create required directories
    required_dirs = [
        app.config.get('UPLOAD_FOLDER', 'uploads'),
        app.config.get('MODEL_PATH', 'models'),
        app.config.get('DATASET_PATH', 'datasets'),
        'logs'
    ]
    
    for dir_path in required_dirs:
        os.makedirs(dir_path, exist_ok=True)
        print(f"📁 Created/Verified directory: {dir_path}")

    # ---- Register Blueprints ----
    register_blueprints(app)

    # ---- Routes ----
    @app.route("/")
    def home():
        return {
            "status": "SnapShroom backend running",
            "version": "1.0",
            "endpoints": {
                "auth": "/api/auth",
                "dataset": "/api/dataset",
                "species": "/api/species",
                "toxicity": "/api/toxicity",
                "habitat": "/api/habitat",
                "risk": "/api/risk"
            }
        }

    @app.route("/health")
    def health_check():
        """Comprehensive health check endpoint"""
        health_status = {
            "status": "healthy",
            "service": "SnapShroom API",
            "version": "1.0.0",
            "checks": {}
        }
        
        # Check MongoDB
        try:
            mongo.db.command('ping')
            health_status["checks"]["mongodb"] = {
                "status": "healthy",
                "database": app.config['MONGO_DBNAME'],
                "collections": mongo.db.list_collection_names()
            }
        except Exception as e:
            health_status["checks"]["mongodb"] = {
                "status": "unhealthy",
                "error": str(e)
            }
            health_status["status"] = "unhealthy"

        # Check directories
        dir_checks = {}
        for dir_name, dir_path in [
            ("uploads", app.config.get('UPLOAD_FOLDER')),
            ("models", app.config.get('MODEL_PATH')),
            ("datasets", app.config.get('DATASET_PATH'))
        ]:
            if dir_path and os.path.exists(dir_path):
                dir_checks[dir_name] = {
                    "status": "healthy",
                    "path": dir_path,
                    "writable": os.access(dir_path, os.W_OK)
                }
            else:
                dir_checks[dir_name] = {
                    "status": "unhealthy",
                    "path": dir_path,
                    "error": "Directory not found or not accessible"
                }
                health_status["status"] = "unhealthy"
        
        health_status["checks"]["directories"] = dir_checks

        # Check models
        model_checks = {}
        for model_name, model_path in [
            ("species_model", app.config.get('SPECIES_MODEL_PATH')),
            ("toxicity_model", app.config.get('TOXICITY_MODEL_PATH')),
            ("pytorch_model", app.config.get('PYTORCH_MODEL_PATH'))
        ]:
            if model_path and os.path.exists(model_path):
                model_checks[model_name] = {
                    "status": "healthy",
                    "path": model_path,
                    "size_mb": os.path.getsize(model_path) / (1024 * 1024)
                }
            else:
                model_checks[model_name] = {
                    "status": "not_found",
                    "path": model_path,
                    "note": "Model file not found, some features may be unavailable"
                }
        
        health_status["checks"]["models"] = model_checks

        # Add configuration info (excluding sensitive data)
        config_info = {
            "debug": app.config.get('DEBUG', False),
            "environment": config_name,
            "host": app.config.get('HOST', '0.0.0.0'),
            "port": app.config.get('PORT', 5000),
            "jwt_enabled": app.config.get('JWT_SECRET_KEY') is not None,
            "cors_enabled": bool(app.config.get('CORS_ORIGINS')),
            "mongo_uri_configured": bool(app.config.get('MONGO_URI'))
        }
        health_status["config"] = config_info

        status_code = 200 if health_status["status"] == "healthy" else 503
        return jsonify(health_status), status_code

    @app.route("/api")
    def api_info():
        """API information endpoint"""
        return {
            "name": "SnapShroom API",
            "description": "AI-powered mushroom identification backend",
            "version": "1.0.0",
            "documentation": "/api/docs",  # You could add Swagger later
            "contact": {
                "email": "support@snapshroom.com",
                "website": "https://snapshroom.com"
            }
        }

    @app.route("/api/status")
    def api_status():
        """Quick status check for load balancers"""
        try:
            mongo.db.command('ping')
            return {"status": "OK", "database": "connected"}, 200
        except:
            return {"status": "SERVICE_UNAVAILABLE", "database": "disconnected"}, 503

    # Error handlers
    from flask import request
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested endpoint does not exist.",
            "path": request.path
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "Something went wrong on our end.",
            "request_id": request.headers.get('X-Request-ID', 'N/A')
        }), 500

    print(f"✅ SnapShroom API initialized successfully!")
    print(f"   Environment: {config_name}")
    print(f"   API Base URL: http://{app.config['HOST']}:{app.config['PORT']}")
    print(f"   MongoDB configured: {'Yes' if app.config.get('MONGO_URI') else 'No'}")
    
    return app


def init_database(db):
    """Initialize database collections with indexes and validation"""
    collections_to_create = ['users', 'identifications', 'species', 'habitats', 'logs']
    
    print("\n📊 Initializing Database Collections...")
    
    for collection_name in collections_to_create:
        if collection_name not in db.list_collection_names():
            db.create_collection(collection_name)
            print(f"   ✅ Created collection: {collection_name}")
        else:
            print(f"   ℹ️  Collection already exists: {collection_name}")
    
    # Create indexes for users collection
    try:
        users = db.users
        
        # Drop existing indexes to ensure they're created correctly
        index_info = users.index_information()
        
        # Create unique index for email (case-insensitive)
        if 'email_1' not in index_info:
            users.create_index([("email", 1)], unique=True, sparse=True)
            print(f"   ✅ Created unique index on email")
        
        # Create unique index for username (case-insensitive)
        if 'username_1' not in index_info:
            users.create_index([("username", 1)], unique=True, sparse=True)
            print(f"   ✅ Created unique index on username")
        
        # Create regular index on created_at for sorting
        if 'created_at_-1' not in index_info:
            users.create_index([("created_at", -1)])
            print(f"   ✅ Created index on created_at")
        
        # Create index for email verification
        if 'email_verified_1' not in index_info:
            users.create_index([("email_verified", 1)])
            print(f"   ✅ Created index on email_verified")
        
    except Exception as e:
        print(f"   ⚠️  Warning creating users indexes: {str(e)}")
    
    # Create indexes for identifications collection
    try:
        identifications = db.identifications
        index_info = identifications.index_information()
        
        if 'user_id_1_created_at_-1' not in index_info:
            identifications.create_index([("user_id", 1), ("created_at", -1)])
            print(f"   ✅ Created compound index on user_id and created_at")
        
        if 'species_1' not in index_info:
            identifications.create_index([("species", 1)])
            print(f"   ✅ Created index on species")
        
        if 'toxicity_1' not in index_info:
            identifications.create_index([("toxicity", 1)])
            print(f"   ✅ Created index on toxicity")
            
    except Exception as e:
        print(f"   ⚠️  Warning creating identifications indexes: {str(e)}")
    
    print("✅ Database initialization completed\n")


def register_blueprints(app):
    """Register all blueprints"""
    try:
        from routes.auth_routes import auth_bp
        from routes.dataset_routes import dataset_bp
        from routes.species_routes import species_bp
        from routes.toxicity_routes import toxicity_bp
        from routes.habitat_routes import habitat_bp
        from routes.risk_routes import risk_bp
        
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        app.register_blueprint(dataset_bp, url_prefix="/api/dataset")
        app.register_blueprint(species_bp, url_prefix="/api/species")
        app.register_blueprint(toxicity_bp, url_prefix="/api/toxicity")
        app.register_blueprint(habitat_bp, url_prefix="/api/habitat")
        app.register_blueprint(risk_bp, url_prefix="/api/risk")
        
        print("✅ All blueprints registered successfully")
        
    except ImportError as e:
        print(f"⚠️  Warning: Failed to import some blueprints: {e}")
        print("   Some API endpoints may be unavailable")


# Create app instance
app = create_app()

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Starting SnapShroom Backend Server")
    print("="*50)
    
    try:
        # Get configuration
        config_name = os.getenv('FLASK_ENV', 'development')
        config_obj = get_config(config_name)
        
        print(f"\n📋 Configuration:")
        print(f"   Environment: {config_name}")
        print(f"   Host: {config_obj.HOST}")
        print(f"   Port: {config_obj.PORT}")
        print(f"   Debug: {config_obj.DEBUG}")
        print(f"   Database URI configured: {'Yes' if os.getenv('DB_URI') else 'No'}")
        print(f"   JWT Secret configured: {'Yes' if os.getenv('JWT_SECRET_KEY') else 'No'}")
        
        # Run the application
        app.run(
            host=config_obj.HOST,
            port=config_obj.PORT,
            debug=config_obj.DEBUG,
            threaded=True
        )
        
    except Exception as e:
        print(f"\n❌ Failed to start server: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check if .env file exists in backend directory")
        print("2. Check if MongoDB URI is correctly set in .env")
        print("3. Verify your .env file has correct configurations")
        print("4. Check if port 5000 is available")
        sys.exit(1)