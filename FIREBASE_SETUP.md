# MITS Bus Tracker - Firebase GPS Integration

## Overview
This Django application tracks real-time GPS location of buses using Firebase Realtime Database. The GPS data comes from your mobile phone's GPS logger app.

## Features
- Real-time GPS tracking via Firebase
- Web-based map interface with live location updates
- Location history tracking
- Mobile GPS logger integration
- Route visualization
- Demo simulation mode

## Setup Instructions

### 1. Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Configure Database Rules:**
   In Firebase Console > Realtime Database > Rules, set:
   ```json
   {
     "rules": {
       "locations": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

3. **Get Configuration:**
   - Go to Project Settings > General
   - Under "Your apps", add a web app
   - Copy the configuration object

4. **Generate Service Account Key:**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

### 2. Update Firebase Configuration

Edit `firebase_config.py` with your Firebase credentials:

```python
FIREBASE_CONFIG = {
    "apiKey": "your-actual-api-key",
    "authDomain": "your-project.firebaseapp.com",
    "databaseURL": "https://your-project-default-rtdb.firebaseio.com/",
    "projectId": "your-project-id",
    "storageBucket": "your-project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:your-app-id"
}

FIREBASE_ADMIN_KEY_PATH = "/path/to/your/serviceAccountKey.json"
```

### 3. Mobile GPS Logger Setup

#### Option 1: GPS Logger for Android
1. Install "GPS Logger" app from Google Play Store
2. Configure logging settings:
   - Set logging interval (e.g., every 10 seconds)
   - Enable auto-upload
   - Set custom URL: `http://your-server.com/api/update/`
   - POST format: `{"lat": %LAT, "lng": %LON, "speed": %SPD, "timestamp": %TIME}`

#### Option 2: HTTP Request Shortcuts (iOS/Android)
1. Install "HTTP Request Shortcuts" or similar app
2. Create a shortcut to send GPS data:
   ```
   URL: http://your-server.com/api/update/
   Method: POST
   Body: {"lat": [GPS_LAT], "lng": [GPS_LNG]}
   ```

#### Option 3: Custom Solution
Send HTTP POST requests to `/api/update/` with JSON data:
```json
{
    "lat": 9.9651,
    "lng": 76.4085,
    "speed": 25.5,
    "accuracy": 5.0,
    "bus_id": "bus_001"
}
```

### 4. Running the Application

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```

3. **Start Django Server:**
   ```bash
   python manage.py runserver
   ```

4. **Initialize Firebase (Optional):**
   ```bash
   python manage.py start_firebase_listener
   ```

### 5. API Endpoints

- `GET /` - Map view interface
- `POST /api/update/` - Update location from GPS logger
- `GET /api/latest/` - Get latest location from database
- `GET /api/firebase/latest/` - Get latest location from Firebase
- `POST /api/firebase/init/` - Initialize Firebase connection
- `GET /api/history/` - Get location history

### 6. Data Flow

1. **Mobile GPS Logger** → Firebase Realtime Database
2. **Firebase** → Django (real-time listener)
3. **Django** → SQLite Database (local storage)
4. **Web Interface** ← Django (API endpoints)

### 7. Firebase Database Structure

```json
{
  "locations": {
    "bus_001": {
      "lat": 9.9651,
      "lng": 76.4085,
      "timestamp": 1642000000000,
      "speed": 25.5,
      "accuracy": 5.0,
      "last_updated": "2024-01-01T12:00:00"
    }
  }
}
```

### 8. Testing

1. **Demo Mode:** Use the "Toggle Demo" button to simulate movement
2. **Manual Update:** Send POST request to `/api/update/`
3. **Firebase Test:** Use Firebase Console to manually add location data

### 9. Troubleshooting

- **Firebase not connecting:** Check `firebase_config.py` and service account key path
- **GPS not updating:** Verify mobile app permissions and network connectivity
- **CORS issues:** Add your domain to Firebase allowed origins

### 10. Production Deployment

1. Set `DEBUG = False` in settings.py
2. Configure proper `ALLOWED_HOSTS`
3. Use a production database (PostgreSQL)
4. Set up HTTPS for secure GPS data transmission
5. Configure Firebase security rules properly

## Mobile GPS Logger Apps Recommendations

### Android:
- **GPS Logger** (BasicAirData)
- **OsmAnd** (with plugins)
- **My Tracks**

### iOS:
- **GPS Logger**
- **MotionX GPS**
- **Gaia GPS**

Most apps support custom URL posting with format strings like:
`http://yourserver.com/api/update/?lat=%LAT&lng=%LON`

Or JSON POST format:
`{"lat": %LAT, "lng": %LON, "speed": %SPD}`
