import os
import sys
import threading
import time
import webview
from waitress import serve

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant.settings')

import django
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from restaurant.wsgi import application


HOST = '127.0.0.1'
PORT = 8765

# 👇 These are used only on the FIRST run (when the DB is empty)
DEFAULT_ADMIN_USERNAME = 'admin'
DEFAULT_ADMIN_PASSWORD = 'admin2026'


def run_migrations():
    try:
        call_command('migrate', interactive=False, verbosity=0)
        print("Migrations applied successfully.")

        User = get_user_model()
        if not User.objects.filter(username=DEFAULT_ADMIN_USERNAME).exists():
            User.objects.create_superuser(
                username=DEFAULT_ADMIN_USERNAME,
                email='',
                password=DEFAULT_ADMIN_PASSWORD,
            )
            print(f"Admin user '{DEFAULT_ADMIN_USERNAME}' created.")
        else:
            print(f"Admin user '{DEFAULT_ADMIN_USERNAME}' already exists.")
    except Exception as e:
        print(f"Migration error: {e}")


def run_server():
    print(f"Starting server on http://{HOST}:{PORT}")
    serve(application, host=HOST, port=PORT, threads=4)


def main():
    run_migrations()

    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(2)

    webview.create_window(
        title='Restaurant Management System',
        url=f'http://{HOST}:{PORT}/',
        width=1280,
        height=800,
        resizable=True,
    )
    webview.start()


if __name__ == '__main__':
    main()