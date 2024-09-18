# receiver/settings.py

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
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'receiver',  # or 'storage', 'reader'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'receiver.urls'  # or 'storage.urls', 'reader.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'receiver.wsgi.application'  # or 'storage.wsgi.application', 'reader.wsgi.application'

# Use dummy database backend for receiver
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy',
    }
}

STATIC_URL = '/static/'
JWT_SECRET = os.getenv('JWT_SECRET')
KAFKA_CONFIG = kafka_config

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True

# Custom logging configuration
LOGGING_CONFIG = None
LOGGING = log_config