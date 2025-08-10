from django.contrib import admin
from django.urls import path
from tracker import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('api/update/', views.update_location, name='update_location'),
    path('api/latest/', views.get_latest_location, name='latest_location'),
    path('api/firebase/latest/', views.get_firebase_location, name='firebase_location'),
    path('api/firebase/init/', views.initialize_firebase, name='initialize_firebase'),
    path('api/history/', views.get_location_history, name='location_history'),
]
