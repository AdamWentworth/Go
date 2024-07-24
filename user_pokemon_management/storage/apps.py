# storage/apps.py

from django.apps import AppConfig
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from .backup_database import create_backup, manage_retention

logger = logging.getLogger('basicLogger')

class StorageConfig(AppConfig):
    name = 'storage'

    def ready(self):
        logger.info("StorageConfig is ready.")
        start_scheduler()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_backup, 'cron', hour=0, minute=0)  # Run at midnight
    scheduler.start()
    logger.info("Scheduler started for daily backups.")

def run_backup():
    logger.info("Starting backup process.")
    create_backup()
    manage_retention()
    logger.info("Backup process completed.")
