import os
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env.development file
load_dotenv(dotenv_path='.env.development')

# Configuration from .env.development
BACKUP_DIR = './backups'  # Update this to the actual path of your backups
DATABASE_USER = os.getenv('DB_USER')
DATABASE_PASSWORD = os.getenv('DB_PASSWORD')
DATABASE_HOST = os.getenv('DB_HOSTNAME')
DATABASE_PORT = os.getenv('DB_PORT', '3306')  # Default to 3306 if not specified
DATABASE_NAME = os.getenv('DB_NAME')
DATABASE_TYPE = 'mysql'  # In this case, you're using MySQL

def get_latest_backup(backup_dir):
    """Find the most recent backup file in the backup directory."""
    try:
        backups = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if os.path.isfile(os.path.join(backup_dir, f))]
        if not backups:
            print("No backups found.")
            return None

        # Sort by last modified time
        latest_backup = max(backups, key=os.path.getmtime)
        print(f"Latest backup file: {latest_backup}")
        return latest_backup
    except Exception as e:
        print(f"Error finding latest backup: {e}")
        return None

def restore_mysql(backup_file):
    """Restore a MySQL database from a backup file."""
    restore_command = f'mysql -h {DATABASE_HOST} -P {DATABASE_PORT} -u {DATABASE_USER} -p{DATABASE_PASSWORD} {DATABASE_NAME} < {backup_file}'
    try:
        subprocess.run(restore_command, shell=True, check=True)
        print(f"Database {DATABASE_NAME} restored successfully from {backup_file}.")
    except subprocess.CalledProcessError as e:
        print(f"Error restoring MySQL database: {e}")

def restore_database():
    """Main function to restore the database from the latest backup."""
    latest_backup = get_latest_backup(BACKUP_DIR)
    if not latest_backup:
        return

    if DATABASE_TYPE == 'mysql':
        restore_mysql(latest_backup)
    else:
        print(f"Unsupported database type: {DATABASE_TYPE}")

if __name__ == "__main__":
    restore_database()
