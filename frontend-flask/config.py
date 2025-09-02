import os
# from typing import Optional

class Config:
    """Application configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', '247165654737')
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    
    # Vertex AI Search Configuration
    VERTEX_AI_LOCATION = os.environ.get('VERTEX_AI_LOCATION', 'global')
    VERTEX_AI_ENGINE_ID = os.environ.get('VERTEX_AI_ENGINE_ID', 'emtek-media-search_1749661340727')
    
    # Search Configuration
    DEFAULT_PAGE_SIZE = int(os.environ.get('DEFAULT_PAGE_SIZE', '10'))
    MAX_PAGE_SIZE = int(os.environ.get('MAX_PAGE_SIZE', '20'))
    
    @classmethod
    def get_vertex_ai_config(cls) -> dict:
        """Get Vertex AI configuration"""
        return {
            'project_id': cls.GOOGLE_CLOUD_PROJECT,
            'location': cls.VERTEX_AI_LOCATION,
            'engine_id': cls.VERTEX_AI_ENGINE_ID
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that required configuration is present"""
        required_vars = [
            cls.GOOGLE_CLOUD_PROJECT,
            cls.VERTEX_AI_ENGINE_ID
        ]
        
        return all(var for var in required_vars)

# Development configuration
class DevelopmentConfig(Config):
    DEBUG = True

# Production configuration  
class ProductionConfig(Config):
    DEBUG = False

# Testing configuration
class TestingConfig(Config):
    TESTING = True
    DEBUG = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 