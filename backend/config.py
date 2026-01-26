import os

class Config:
    # ===============================
    # Flask Core Configuration
    # ===============================
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

    # ===============================
    # MongoDB Configuration
    # ===============================
    MONGO_URI = os.environ.get('MONGO_URI') or "mongodb://localhost:27017/mushroom_app"

    # ===============================
    # JWT Configuration
    # ===============================
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'super-secret-jwt-key'
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day (in seconds)

    # ===============================
    # Upload Configuration
    # ===============================
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # ===============================
    # Model Configuration
    # ===============================
    MODEL_PATH = os.path.join(os.getcwd(), 'models')
    SPECIES_MODEL_PATH = os.path.join(MODEL_PATH, 'species_model.pkl')
    TOXICITY_MODEL_PATH = os.path.join(MODEL_PATH, 'toxicity_model.pkl')
    PYTORCH_MODEL_PATH = os.path.join(MODEL_PATH, 'mushroom_edibility.pth')

    # ===============================
    # Dataset Configuration
    # ===============================
    DATASET_PATH = os.path.join(os.getcwd(), 'dataset')
    CSV_PATH = os.path.join(os.getcwd(), 'mushrooms.csv')

    # ===============================
    # API Configuration
    # ===============================
    API_PREFIX = '/api'
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))

    # ===============================
    # CORS Configuration
    # ===============================
    CORS_ORIGINS = [
        "http://localhost:8081",  # Expo web
        "http://localhost:3000",  # React dev
        "exp://*",               # Expo Go
        "*"                      # Dev only
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    MONGO_URI = os.environ.get('MONGO_URI')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')


# ===============================
# Configuration Mapping
# ===============================
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(config_name='default'):
    return config.get(config_name, config['default'])()
