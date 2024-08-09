# manage.py

#!/usr/bin/env python
import os
import sys

def execute_command(command):
    # Set the DJANGO_SETTINGS_MODULE environment variable
    os.environ['DJANGO_SETTINGS_MODULE'] = 'storage.settings'
    
    # Set STORAGE_SERVICE to true to ensure Kafka consumer starts
    os.environ['STORAGE_SERVICE'] = 'true'
    
    # Ensure the current directory is in the Python path
    current_path = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_path)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(command)

def main():
    if len(sys.argv) < 2:
        # If no command is provided, run the server on port 3004 by default
        command = ['runserver', '3004']
    else:
        command = sys.argv[1:]
    
    execute_command([sys.argv[0]] + command)

if __name__ == '__main__':
    main()
