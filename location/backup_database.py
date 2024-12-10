import os
import subprocess

def backup_database(database_name, output_file, host="localhost", port=5432, username="postgres"):
    try:
        # Construct the pg_dump command
        command = [
            "pg_dump",
            f"--host={host}",
            f"--port={port}",
            f"--username={username}",
            "--format=plain",  # SQL format
            "--no-password",   # Assume that authentication is handled
            "--file", output_file,
            database_name
        ]

        print(f"Starting backup for database: {database_name}")

        # Execute the command
        subprocess.run(command, check=True)

        print(f"Backup completed successfully. File saved to: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Error during backup: {e}")
        print("Ensure that pg_dump is installed and configured correctly in your system PATH.")

if __name__ == "__main__":
    # Specify the database details
    database_name = "locations"
    output_file = "locations_backup.sql"  # Adjust path as needed

    # Prompt for PostgreSQL user password (or use a .pgpass file for secure automation)
    os.environ["PGPASSWORD"] = REMOVED_PASSWORD

    # Call the backup function
    backup_database(
        database_name=database_name,
        output_file=output_file,
        host="localhost",  # Change if the database server is remote
        port=5432,          # Adjust port if necessary
        username="postgres"  # Adjust username if different
    )
