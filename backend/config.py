import os

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

    # Upload configuration
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Model configuration
    MODEL_PATH = os.path.join(os.getcwd(), 'models')
    SPECIES_MODEL_PATH = os.path.join(MODEL_PATH, 'species_model.pkl')
    TOXICITY_MODEL_PATH = os.path.join(MODEL_PATH, 'toxicity_model.pkl')
    PYTORCH_MODEL_PATH = os.path.join(MODEL_PATH, 'mushroom_edibility.pth')

    # Dataset configuration
    DATASET_PATH = os.path.join(os.getcwd(), 'dataset')
    CSV_PATH = os.path.join(os.getcwd(), 'mushrooms.csv')

    # API configuration
    API_PREFIX = '/api'
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))

    # CORS configuration
    CORS_ORIGINS = [
        "http://localhost:8081",  # Expo web
        "http://localhost:3000",  # React dev server
        "exp://*",               # Expo Go
        "*"                      # Allow all for development
    ]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config(config_name='default'):
    return config.get(config_name, config['default'])()