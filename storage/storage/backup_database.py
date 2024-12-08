import os
import subprocess
import datetime
from pathlib import Path
import logging
from dotenv import dotenv_values

logger = logging.getLogger('backupLogger')

# Explicitly set the path to .env.development in the second storage folder
env_path = Path(__file__).resolve().parent / ".env.development"

# Check if the file exists
if not env_path.exists():
    raise FileNotFoundError(f".env.development file not found at: {env_path}")

# Load environment variables from the .env file
config = dotenv_values(env_path)

# Access variables from the dictionary
DB_NAME = config.get("DB_NAME")
if not DB_NAME:
    raise ValueError("DB_NAME is not defined in .env.development")

print(f"DB_NAME: {DB_NAME}")

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
        print(f"Backup created successfully: {backup_filepath}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create backup: {e}")
        print(f"Failed to create backup: {e}")

def manage_retention():
    today = datetime.datetime.now()
    daily_cutoff = today - datetime.timedelta(days=30)
    monthly_cutoff = today - datetime.timedelta(days=365)
    yearly_cutoff = today - datetime.timedelta(days=365*5)

    logger.info("Starting to manage backup retention...")
    
    for file in BACKUP_DIR.iterdir():
        if file.suffix == ".sql":
            try:
                # Extract the date part from the filename
                file_date_str = file.stem.split('_')[-1]
                file_date = datetime.datetime.strptime(file_date_str, "%Y-%m-%d")
                logger.info(f"Processing backup: {file.name}, Date: {file_date}")

                # Determine retention policy
                if file_date < daily_cutoff and file_date.day != 1:
                    logger.info(f"Backup older than daily cutoff: {file.name}")
                    if file_date < monthly_cutoff and file_date.month != 1:
                        logger.info(f"Backup older than monthly cutoff: {file.name}")
                        if file_date < yearly_cutoff:
                            logger.info(f"Deleting backup older than yearly cutoff: {file.name}")
                            file.unlink()
                            logger.info(f"Deleted backup: {file.name}")
                            print(f"Deleted backup: {file.name}")
                else:
                    logger.info(f"Retained backup: {file.name}")
            except ValueError as e:
                logger.error(f"Error parsing date from file {file}: {e}")
                print(f"Error parsing date from file {file}: {e}")

    logger.info("Finished managing backup retention.")
    print("Finished managing backup retention.")

if __name__ == "__main__":
    create_backup()
    manage_retention()
