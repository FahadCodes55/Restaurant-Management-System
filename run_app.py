import os
import sys
import webbrowser
import threading
import django
from django.core.management import call_command

def open_browser():
    webbrowser.open('http://127.0.0.1:8000')

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant.settings')
    django.setup()

    # Apply database migrations on launch
    try:
        call_command('migrate')
    except Exception as e:
        print(f"Migration failed: {e}")

    # Launch browser after 1.5s delay
    threading.Timer(1.5, open_browser).start()

    # Run Django local web server
    call_command('runserver', '127.0.0.1:8000', '--noreload')