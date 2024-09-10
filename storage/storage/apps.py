# storage/apps.py

from django.apps import AppConfig
import logging
import os
import threading

logger = logging.getLogger('basicLogger')

class StorageConfig(AppConfig):
    name = 'storage'
    kafka_consumer_started = False  # Flag to ensure Kafka consumer starts only once
    scheduler_started = False  # Flag to ensure scheduler starts only once

    def ready(self):
        # Prevent multiple initialization during development server reloads
        if os.environ.get('RUN_MAIN') == 'true':
            logger.info("StorageConfig is ready.")

            # Start the scheduler and Kafka consumer only if STORAGE_SERVICE is true
            if os.getenv('STORAGE_SERVICE', 'false').lower() == 'true':
                if not self.scheduler_started:
                    logger.info("Starting scheduler for daily backups.")
                    start_scheduler()
                    self.scheduler_started = True
                
                if not self.kafka_consumer_started:
                    logger.info("Starting Kafka consumer.")
                    start_kafka_consumer()
                    self.kafka_consumer_started = True

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
    
    # Create a new backup
    try:
        create_backup()
        logger.info("Backup created successfully.")
    except Exception as e:
        logger.error(f"Error during backup creation: {e}")

    # Call manage_retention with logging and error handling
    try:
        logger.info("Starting retention management process.")
        manage_retention()
        logger.info("Retention management completed successfully.")
    except Exception as e:
        logger.error(f"Error during retention management: {e}")

    logger.info("Backup process completed.")

def start_kafka_consumer():
    from .consumer import consume_messages
    # Start the Kafka consumer in a separate thread
    threading.Thread(target=consume_messages, daemon=True).start()
