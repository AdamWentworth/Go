#!/usr/bin/env python
import os
import sys

def execute_command(command):
    os.environ['DJANGO_SETTINGS_MODULE'] = 'storage.settings'
    os.environ['PYTHONPATH'] = os.path.dirname(os.path.abspath(__file__))

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line([sys.argv[0]] + command)

def main():
    if len(sys.argv) < 2:
        print("Usage: migrate.py <command> [<args>]")
        return

    command = sys.argv[1:]
    execute_command(command)

if __name__ == '__main__':
    main()
