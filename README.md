# MITS Bus Tracker (Django)

### 📦 Setup Instructions

1. Install dependencies:
```
pip install django
```

2. Navigate to project and run:
```
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

3. In a separate terminal:
```
cd gps_simulator
python gps_simulator.py
```

4. Open browser at:
```
http://127.0.0.1:8000/
```
You'll see the live map tracking simulated GPS data.
