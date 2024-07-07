# storage/settings.py

import os
import yaml
import logging.config
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env.development")

# Setup logging from YAML configuration
log_conf_file = BASE_DIR / "config/log_conf.yml"
with open(log_conf_file, 'r') as f:
    log_config = yaml.safe_load(f.read())
    logging.config.dictConfig(log_config)
logger = logging.getLogger('basicLogger')

# Load app configuration
app_conf_file = BASE_DIR / "config/app_conf.yml"
with open(app_conf_file, 'r') as f:
    app_config = yaml.safe_load(f.read())

# Kafka setup using loaded app configuration
kafka_config = app_config['events']
kafka_config['hostname'] = os.getenv('HOST_IP')

# Django settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'default-secret-key')
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'storage',  # Only include your custom app
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'storage.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': app_config['database']['db'],
        'USER': app_config['database']['user'],
        'PASSWORD': app_config['database']['password'],
        'HOST': app_config['database']['hostname'],
        'PORT': app_config['database']['port'],
    }
}

STATIC_URL = '/static/'
JWT_SECRET = os.getenv('JWT_SECRET')
KAFKA_CONFIG = kafka_config

# Custom logging configuration
LOGGING_CONFIG = None
LOGGING = log_config

