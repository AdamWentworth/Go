# storage/backup_database.py

import os
import subprocess
import datetime
from pathlib import Path
import logging
from dotenv import load_dotenv

logger = logging.getLogger('backupLogger')

# Load environment variables from .env.development
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.development")

# Configuration
DB_NAME = os.getenv('DB_NAME')

# Determine the backup directory relative to this script
BASE_DIR = Path(__file__).resolve().parent
BACKUP_DIR = BASE_DIR / 'backups'
MY_CNF_PATH = BASE_DIR / 'my.cnf'

# Ensure backup directory exists
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def create_backup():
    today = datetime.datetime.now()
    date_str = today.strftime("%Y-%m-%d")
    backup_filename = f"user_pokemon_backup_{date_str}.sql"
    backup_filepath = BACKUP_DIR / backup_filename

    dump_command = (
        f"mysqldump --defaults-extra-file={MY_CNF_PATH} {DB_NAME} > {backup_filepath}"
    )

    try:
        subprocess.run(dump_command, shell=True, check=True)
        logger.info(f"Backup created successfully: {backup_filepath}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create backup: {e}")

def manage_retention():
    today = datetime.datetime.now()
    daily_cutoff = today - datetime.timedelta(days=30)
    monthly_cutoff = today - datetime.timedelta(days=365)
    yearly_cutoff = today - datetime.timedelta(days=365*5)

    for file in BACKUP_DIR.iterdir():
        if file.suffix == ".sql":
            try:
                # Extract the date part from the filename
                file_date_str = file.stem.split('_')[-1]
                file_date = datetime.datetime.strptime(file_date_str, "%Y-%m-%d")

                # Determine retention policy
                if file_date < daily_cutoff and file_date.day != 1:
                    if file_date < monthly_cutoff and file_date.month != 1:
                        if file_date < yearly_cutoff:
                            file.unlink()
                            logger.info(f"Deleted old backup: {file}")
            except ValueError as e:
                logger.error(f"Error parsing date from file {file}: {e}")

if __name__ == "__main__":
    create_backup()
    manage_retention()

