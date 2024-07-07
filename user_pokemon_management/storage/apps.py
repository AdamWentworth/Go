# storage/apps.py

from django.apps import AppConfig
import logging

logger = logging.getLogger('basicLogger')

class StorageConfig(AppConfig):
    name = 'storage'

    def ready(self):
        logger.info("StorageConfig is ready.")


