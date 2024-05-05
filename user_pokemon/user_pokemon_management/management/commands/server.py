from django.core.management.commands.runserver import Command as RunserverCommand

class Command(RunserverCommand):
    help = 'Runs the Django server on a specified port'

    def handle(self, *args, **options):
        options['addrport'] = '3002'
        super().handle(*args, **options)
