from django.shortcuts import render
from django.http import JsonResponse
from .models import BusLocation
from django.views.decorators.csrf import csrf_exempt
import json

def map_view(request):
    return render(request, 'bus_tracker/map.html')

@csrf_exempt
def update_location(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        BusLocation.objects.create(latitude=data['lat'], longitude=data['lon'])
        return JsonResponse({'status': 'updated'})

def get_latest_location(request):
    location = BusLocation.objects.last()
    if location:
        return JsonResponse({'lat': location.latitude, 'lon': location.longitude})
    return JsonResponse({'lat': 0, 'lon': 0})

