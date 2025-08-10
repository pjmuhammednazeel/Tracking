import firebase_admin
from firebase_admin import credentials, db
import pyrebase
from django.conf import settings
import json
import threading
import time
from tracker.models import BusLocation
from datetime import datetime

class FirebaseGPSService:
    def __init__(self):
        self.firebase_config = None
        self.firebase = None
        self.db_ref = None
        self.admin_db = None
        self.listening = False
        
    def initialize_firebase(self, config):
        """Initialize Firebase with provided configuration"""
        try:
            self.firebase_config = config
            
            # Initialize Pyrebase for real-time database
            self.firebase = pyrebase.initialize_app(config)
            self.database = self.firebase.database()
            
            print("Firebase initialized successfully!")
            return True
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            return False
    
    def initialize_admin_sdk(self, service_account_path, database_url):
        """Initialize Firebase Admin SDK for server-side operations"""
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': database_url
                })
            
            self.admin_db = db.reference()
            print("Firebase Admin SDK initialized!")
            return True
        except Exception as e:
            print(f"Firebase Admin SDK error: {e}")
            return False
    
    def listen_for_location_updates(self, bus_id="bus_001"):
        """Listen for real-time location updates from Firebase"""
        if not self.database:
            print("Firebase not initialized!")
            return
        
        def location_listener(event):
            try:
                if event.data:
                    data = event.data
                    if isinstance(data, dict) and 'lat' in data and 'lng' in data:
                        # Save to Django database
                        BusLocation.objects.create(
                            latitude=float(data['lat']),
                            longitude=float(data['lng'])
                        )
                        print(f"Location updated: {data['lat']}, {data['lng']}")
                        
                        # Optional: Add additional fields if available
                        if 'timestamp' in data:
                            print(f"Timestamp: {data['timestamp']}")
                        if 'speed' in data:
                            print(f"Speed: {data['speed']} km/h")
                        if 'accuracy' in data:
                            print(f"Accuracy: {data['accuracy']} meters")
                            
            except Exception as e:
                print(f"Error processing location update: {e}")
        
        # Start listening to location updates
        self.database.child(f"locations/{bus_id}").stream(location_listener)
        self.listening = True
        print(f"Started listening for GPS updates for {bus_id}")
    
    def get_latest_location_from_firebase(self, bus_id="bus_001"):
        """Get the latest location from Firebase"""
        try:
            if self.database:
                location = self.database.child(f"locations/{bus_id}").get()
                if location.val():
                    return location.val()
            return None
        except Exception as e:
            print(f"Error getting location from Firebase: {e}")
            return None
    
    def update_location_to_firebase(self, lat, lng, bus_id="bus_001", additional_data=None):
        """Update location in Firebase (for testing purposes)"""
        try:
            location_data = {
                "lat": lat,
                "lng": lng,
                "timestamp": int(time.time() * 1000),  # milliseconds
                "last_updated": datetime.now().isoformat()
            }
            
            if additional_data:
                location_data.update(additional_data)
            
            if self.database:
                self.database.child(f"locations/{bus_id}").set(location_data)
                print(f"Location updated in Firebase: {lat}, {lng}")
                return True
            return False
        except Exception as e:
            print(f"Error updating location to Firebase: {e}")
            return False

# Global Firebase service instance
firebase_service = FirebaseGPSService()
