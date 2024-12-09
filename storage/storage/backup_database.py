# backup_database.py

import os
import subprocess
import datetime
from pathlib import Path
import logging
from dotenv import dotenv_values

logger = logging.getLogger('backupLogger')
logger.setLevel(logging.INFO)  # Set log level as needed

# Stream handler for demonstration (you can customize as needed)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
logger.addHandler(console_handler)

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

    # After creation, manage retention
    manage_retention()

def manage_retention():
    # Define retention policy
    dailyRetentionDays = 30      # Keep daily backups for 30 days
    monthlyRetentionMonths = 12  # Keep monthly backups for 12 months
    yearlyRetentionYears = 5     # Keep yearly backups for 5 years

    now = datetime.datetime.now()
    logger.info("Starting to manage backup retention...")

    for file in BACKUP_DIR.iterdir():
        if file.suffix == ".sql":
            # Filename format: user_pokemon_backup_YYYY-MM-DD.sql
            # Extract the date from the filename
            parts = file.stem.split('_')
            if len(parts) < 4:
                logger.error(f"Filename does not match expected format: {file.name}")
                print(f"Filename does not match expected format: {file.name}")
                continue

            file_date_str = parts[-1]  # The last part should be YYYY-MM-DD
            try:
                file_date = datetime.datetime.strptime(file_date_str, "%Y-%m-%d")
            except ValueError as e:
                logger.error(f"Error parsing date from file {file.name}: {e}")
                print(f"Error parsing date from file {file.name}: {e}")
                continue

            logger.info(f"Processing backup: {file.name}, Date: {file_date}")

            # Determine backup type (yearly, monthly, daily)
            # Yearly: Jan 1st, Monthly: 1st of month (but not Jan 1), Daily: everything else
            is_yearly = (file_date.month == 1 and file_date.day == 1)
            is_monthly = (file_date.day == 1 and not is_yearly)
            is_daily = (not is_yearly and not is_monthly)

            # Calculate ages
            age_in_days = (now - file_date).days
            # For months: approximate by year/month differences (ignoring days)
            age_in_months = (now.year - file_date.year) * 12 + (now.month - file_date.month)
            age_in_years = now.year - file_date.year

            logger.info(f"Type: {'Yearly' if is_yearly else 'Monthly' if is_monthly else 'Daily'}")
            logger.info(f"Age: {age_in_days} days, {age_in_months} months, {age_in_years} years")

            should_delete = False

            if is_daily and age_in_days > dailyRetentionDays:
                logger.info(f"Daily backup {file.name} is older than {dailyRetentionDays} days. Deleting.")
                should_delete = True
            elif is_monthly and age_in_months > monthlyRetentionMonths:
                logger.info(f"Monthly backup {file.name} is older than {monthlyRetentionMonths} months. Deleting.")
                should_delete = True
            elif is_yearly and age_in_years > yearlyRetentionYears:
                logger.info(f"Yearly backup {file.name} is older than {yearlyRetentionYears} years. Deleting.")
                should_delete = True
            else:
                logger.info(f"Retained backup: {file.name}")

            if should_delete:
                try:
                    file.unlink()
                    logger.info(f"Deleted old backup: {file.name}")
                    print(f"Deleted old backup: {file.name}")
                except Exception as e:
                    logger.error(f"Failed to delete file {file.name}: {e}")
                    print(f"Failed to delete file {file.name}: {e}")

    logger.info("Finished managing backup retention.")
    print("Finished managing backup retention.")

if __name__ == "__main__":
    # If run directly, create a backup and manage retention
    create_backup()
