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

# Additional logger configuration for backup process
log_config['loggers']['backupLogger'] = {
    'handlers': ['file'],
    'level': 'INFO',
    'propagate': False,
}

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
        'ENGINE': 'django.db.backends.mysql',  # Use Django's built-in backend for MySQL
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOSTNAME'),
        'PORT': os.getenv('DB_PORT'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'connect_timeout': 10,
            'read_timeout': 10,
            'write_timeout': 10,
        },
    }
}

STATIC_URL = '/static/'
JWT_SECRET = os.getenv('JWT_SECRET')
KAFKA_CONFIG = kafka_config

# Custom logging configuration
LOGGING_CONFIG = None
LOGGING = log_config

# Set APScheduler log level to WARNING to suppress INFO level logs
log_config['loggers']['apscheduler'] = {
    'handlers': ['console', 'file'],
    'level': 'WARNING',
    'propagate': False,
}

# Reapply the logging configuration
logging.config.dictConfig(log_config)