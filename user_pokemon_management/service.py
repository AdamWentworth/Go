#!/usr/bin/env python
import os
import sys
import threading
import django

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

    if service == 'storage':
        os.environ['STORAGE_SERVICE'] = 'true'
    else:
        os.environ['STORAGE_SERVICE'] = 'false'

    try:
        django.setup()
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    if service == 'storage':
        from storage.consumer import consume_messages
        threading.Thread(target=consume_messages, daemon=True).start()

    from django.core.management import execute_from_command_line
    execute_from_command_line([sys.argv[0], 'runserver', '--noreload', str(port_mapping[service])])

def main():
    if len(sys.argv) != 2:
        print("Usage: service.py <service>")
        return

    service = sys.argv[1]
    run_service(service)

if __name__ == '__main__':
    main()
