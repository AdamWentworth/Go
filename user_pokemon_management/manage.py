#!/usr/bin/env python
import os
import sys

def run_service(service):
    port_mapping = {
        'receiver': 3003,
        'storage': 3004,
        'reader': 3005
    }

    if service not in port_mapping:
        print(f"Unknown service: {service}")
        return

    os.environ['DJANGO_SETTINGS_MODULE'] = f'{service}.settings'
    os.environ['PYTHONPATH'] = os.path.dirname(os.path.abspath(__file__))

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line([sys.argv[0], 'runserver', '--noreload', str(port_mapping[service])])

def main():
    if len(sys.argv) != 2:
        print("Usage: manage.py <service>")
        return

    service = sys.argv[1]
    run_service(service)

if __name__ == '__main__':
    main()
