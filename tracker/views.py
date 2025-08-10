from django.shortcuts import render
from django.http import JsonResponse
from .models import BusLocation
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json
import threading
from .firebase_service import firebase_service

def map_view(request):
    context = {
        'firebase_enabled': getattr(settings, 'FIREBASE_ENABLED', False)
    }
    return render(request, 'bus_tracker/map.html', context)

@csrf_exempt
def update_location(request):
    """Handle location updates from GPS logger or manual input"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            latitude = float(data.get('lat', 0))
            longitude = float(data.get('lng', data.get('lon', 0)))  # Support both 'lng' and 'lon'
            
            # Extract additional GPS data
            speed = data.get('speed')
            accuracy = data.get('accuracy')
            bearing = data.get('bearing')
            bus_id = data.get('bus_id', 'bus_001')
            
            # Save to Django database
            location_data = {
                'latitude': latitude,
                'longitude': longitude,
                'bus_id': bus_id
            }
            
            if speed is not None:
                location_data['speed'] = float(speed)
            if accuracy is not None:
                location_data['accuracy'] = float(accuracy)
            if bearing is not None:
                location_data['bearing'] = float(bearing)
            
            location = BusLocation.objects.create(**location_data)
            
            # Also update Firebase if configured
            if getattr(settings, 'FIREBASE_ENABLED', False):
                additional_data = {}
                if speed is not None:
                    additional_data['speed'] = speed
                if accuracy is not None:
                    additional_data['accuracy'] = accuracy
                if bearing is not None:
                    additional_data['bearing'] = bearing
                    
                firebase_service.update_location_to_firebase(
                    latitude, longitude, 
                    bus_id=bus_id,
                    additional_data=additional_data
                )
            
            return JsonResponse({
                'status': 'updated', 
                'id': location.id,
                'latitude': latitude,
                'longitude': longitude,
                'bus_id': bus_id
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def get_latest_location(request):
    """Get the latest location from Django database"""
    location = BusLocation.objects.last()
    if location:
        return JsonResponse({
            'lat': location.latitude, 
            'lng': location.longitude,
            'timestamp': location.timestamp.isoformat()
        })
    return JsonResponse({'lat': 0, 'lng': 0, 'timestamp': None})

def get_firebase_location(request):
    """Get the latest location directly from Firebase"""
    if not getattr(settings, 'FIREBASE_ENABLED', False):
        return JsonResponse({'error': 'Firebase not configured'}, status=400)
    
    bus_id = request.GET.get('bus_id', 'bus_001')
    location = firebase_service.get_latest_location_from_firebase(bus_id)
    
    if location:
        return JsonResponse(location)
    return JsonResponse({'error': 'No location found'}, status=404)

def initialize_firebase(request):
    """Initialize Firebase connection (admin only)"""
    if not getattr(settings, 'FIREBASE_ENABLED', False):
        return JsonResponse({'error': 'Firebase configuration not found'}, status=400)
    
    try:
        # Initialize Firebase
        success = firebase_service.initialize_firebase(settings.FIREBASE_CONFIG)
        if success and settings.FIREBASE_ADMIN_KEY_PATH:
            firebase_service.initialize_admin_sdk(
                settings.FIREBASE_ADMIN_KEY_PATH,
                settings.FIREBASE_CONFIG['databaseURL']
            )
        
        if success:
            # Start listening for updates in a separate thread
            listener_thread = threading.Thread(
                target=firebase_service.listen_for_location_updates,
                daemon=True
            )
            listener_thread.start()
            
            return JsonResponse({'status': 'Firebase initialized and listening'})
        else:
            return JsonResponse({'error': 'Firebase initialization failed'}, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_location_history(request):
    """Get location history for tracking route"""
    limit = int(request.GET.get('limit', 50))
    locations = BusLocation.objects.order_by('-timestamp')[:limit]
    
    history = []
    for location in reversed(locations):  # Reverse to get chronological order
        history.append({
            'lat': location.latitude,
            'lng': location.longitude,
            'timestamp': location.timestamp.isoformat()
        })
    
    return JsonResponse({'locations': history})

