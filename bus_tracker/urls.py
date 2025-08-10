from django.contrib import admin
from django.urls import path
from tracker import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('api/update/', views.update_location, name='update_location'),
    path('api/latest/', views.get_latest_location, name='latest_location'),
]
