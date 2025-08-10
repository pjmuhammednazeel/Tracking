from django.core.management.base import BaseCommand
from tracker.firebase_service import firebase_service
from django.conf import settings

class Command(BaseCommand):
    help = 'Start Firebase GPS listener for real-time location updates'

    def handle(self, *args, **options):
        if not getattr(settings, 'FIREBASE_ENABLED', False):
            self.stdout.write(
                self.style.ERROR('Firebase not configured. Please set up firebase_config.py')
            )
            return

        self.stdout.write('Initializing Firebase...')
        
        # Initialize Firebase
        success = firebase_service.initialize_firebase(settings.FIREBASE_CONFIG)
        
        if success and settings.FIREBASE_ADMIN_KEY_PATH:
            firebase_service.initialize_admin_sdk(
                settings.FIREBASE_ADMIN_KEY_PATH,
                settings.FIREBASE_CONFIG['databaseURL']
            )

        if success:
            self.stdout.write(
                self.style.SUCCESS('Firebase initialized successfully!')
            )
            self.stdout.write('Starting GPS location listener...')
            
            # Start listening for location updates
            try:
                firebase_service.listen_for_location_updates()
                self.stdout.write(
                    self.style.SUCCESS('GPS listener started! Press Ctrl+C to stop.')
                )
                
                # Keep the command running
                import time
                while True:
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                self.stdout.write(
                    self.style.WARNING('\nStopping GPS listener...')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error: {e}')
                )
        else:
            self.stdout.write(
                self.style.ERROR('Firebase initialization failed!')
            )
