import os
import glob
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def restore_latest_backup(database_name, backup_directory=".", host="localhost", port=5432, username="postgres"):
    try:
        # Set the password from the .env file
        os.environ["PGPASSWORD"] = os.getenv("POST_PASSSWORD")
        if not os.environ["PGPASSWORD"]:
            raise ValueError("DB_PASSWORD is not set in the .env file.")

        # Find the latest backup file
        backup_files = glob.glob(os.path.join(backup_directory, "*.dump"))
        if not backup_files:
            raise FileNotFoundError("No backup files found in the specified directory.")

        latest_backup = max(backup_files, key=os.path.getctime)
        print(f"Latest backup file identified: {latest_backup}")

        # Construct the pg_restore command
        command = [
            "pg_restore",
            f"--host={host}",
            f"--port={port}",
            f"--username={username}",
            "--clean",         # Drops existing objects before restoring
            "--dbname", database_name,
            "--no-password",   # Use PGPASSWORD environment variable
            latest_backup
        ]

        print(f"Starting restore for database: {database_name} using backup: {latest_backup}")

        # Execute the command
        subprocess.run(command, check=True)

        print(f"Restore completed successfully for database: {database_name}")

    except subprocess.CalledProcessError as e:
        print(f"Error during restore: {e}")
    except FileNotFoundError as e:
        print(e)
    except ValueError as e:
        print(e)

if __name__ == "__main__":
    # Specify the database details
    database_name = "locations"
    backup_directory = "./backups"  # Adjust path to where backups are stored

    # Call the restore function
    restore_latest_backup(
        database_name=database_name,
        backup_directory=backup_directory,
        host="localhost",  # Change if the database server is remote
        port=5432,          # Adjust port if necessary
        username="postgres"  # Adjust username if different
    )
