import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def backup_database(database_name, output_file, host="localhost", port=5432, username="postgres"):
    try:
        # Set the password from the .env file
        os.environ["PGPASSWORD"] = os.getenv("DB_PASSWORD")
        if not os.environ["PGPASSWORD"]:
            raise ValueError("DB_PASSWORD is not set in the .env file.")

        # Construct the pg_dump command
        command = [
            "pg_dump",
            f"--host={host}",
            f"--port={port}",
            f"--username={username}",
            "--format=custom",  # Compressed binary format
            "--compress=9",     # Maximum compression level
            "--no-password",    # Use PGPASSWORD environment variable
            "--file", output_file,
            database_name
        ]

        print(f"Starting backup for database: {database_name}")

        # Execute the command
        subprocess.run(command, check=True)

        print(f"Backup completed successfully. File saved to: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Error during backup: {e}")
    except FileNotFoundError:
        print("pg_dump is not installed or not found in the system PATH.")
    except ValueError as e:
        print(e)

if __name__ == "__main__":
    # Specify the database details
    database_name = "locations"
    timestamp = datetime.now().strftime("%Y-%m-%d")  # Add timestamp to the filename
    backup_folder = os.path.join(os.getcwd(), "backups")

    # Ensure the backups folder exists
    if not os.path.exists(backup_folder):
        os.makedirs(backup_folder)

    output_file = os.path.join(backup_folder, f"locations_backup_{timestamp}.dump")

    # Call the backup function
    backup_database(
        database_name=database_name,
        output_file=output_file,
        host="localhost",  # Change if the database server is remote
        port=5432,          # Adjust port if necessary
        username="postgres"  # Adjust username if different
    )