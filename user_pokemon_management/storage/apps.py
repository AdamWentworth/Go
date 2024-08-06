# storage/apps.py

from django.apps import AppConfig
import logging
import os

logger = logging.getLogger('basicLogger')

class StorageConfig(AppConfig):
    name = 'storage'

    def ready(self):
        logger.info("StorageConfig is ready.")
        # Only start the scheduler if the STORAGE_SERVICE environment variable is set
        if os.getenv('STORAGE_SERVICE', 'false').lower() == 'true':
            logger.info("Starting scheduler for daily backups.")
            start_scheduler()

def start_scheduler():
    from apscheduler.schedulers.background import BackgroundScheduler
    from .backup_database import create_backup, manage_retention

    scheduler = BackgroundScheduler()
    scheduler.add_job(run_backup, 'cron', hour=0, minute=0)  # Run at midnight
    scheduler.start()
    logger.info("Scheduler started for daily backups.")

def run_backup():
    from .backup_database import create_backup, manage_retention
    logger.info("Starting backup process.")
    create_backup()
    manage_retention()
    logger.info("Backup process completed.")
