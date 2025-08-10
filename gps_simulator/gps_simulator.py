import requests
import time

# Realistic path between MITS and Kolenchery and back
path = [
    [10.0300, 76.3200],  # MITS
    [10.0365, 76.3450],  # Near Varikoli Junction
    [10.0450, 76.3800],  # Puthencruz
    [10.0596, 76.4797],  # Kolenchery
    [10.0450, 76.3800],  # Puthencruz (return)
    [10.0365, 76.3450],  # Near Varikoli Junction (return)
    [10.0300, 76.3200],  # MITS
]

# Estimated speed: ~50km/h => 13.9 m/s
interval = 3  # seconds between updates
print("Starting bus simulation...")

for point in path:
    lat, lon = point
    try:
        requests.post("http://127.0.0.1:8000/api/update/", json={"lat": lat, "lon": lon})
        print(f"Updated: {lat}, {lon}")
    except Exception as e:
        print("Failed:", e)
    time.sleep(interval)
