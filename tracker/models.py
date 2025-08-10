from django.db import models

class BusLocation(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now=True)
    speed = models.FloatField(null=True, blank=True, help_text="Speed in km/h")
    accuracy = models.FloatField(null=True, blank=True, help_text="GPS accuracy in meters")
    bearing = models.FloatField(null=True, blank=True, help_text="Direction of travel in degrees")
    bus_id = models.CharField(max_length=50, default="bus_001", help_text="Unique bus identifier")
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Bus Location"
        verbose_name_plural = "Bus Locations"
    
    def __str__(self):
        return f"{self.bus_id} at ({self.latitude}, {self.longitude}) - {self.timestamp}"
