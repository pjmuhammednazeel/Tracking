import React, { useState, useRef } from "react";
import { View, Button, Text, StyleSheet, Alert } from "react-native";
import { StatusBar } from 'expo-status-bar';
import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';
import { db, ref, set } from "./firebase";

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      const { latitude, longitude, accuracy, speed } = location.coords;
      const timestamp = new Date().toISOString();

      const locationData = {
        latitude,
        longitude,
        accuracy,
        speed,
        timestamp,
        source: 'background'
      };

      // Send to Firebase
      set(ref(db, "mobile_location"), locationData)
        .then(() => {
          console.log("Background location sent to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error sending background location to Firebase:", error);
        });
    }
  }
});

export default function App() {
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchId = useRef(null);

  const startTracking = async () => {
    // Request foreground permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required for GPS tracking");
      return;
    }

    // Request background permissions
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== "granted") {
      Alert.alert("Background Permission", "Background location access denied. App will only track when open.");
    }

    setTracking(true);

    // Start foreground location tracking
    watchId.current = await Location.watchPositionAsync(
      { 
        accuracy: Location.Accuracy.High, 
        timeInterval: 5000, // 5 seconds - perfect balance
        distanceInterval: 0 
      },
      (location) => {
        const { latitude, longitude, accuracy, speed } = location.coords;
        const timestamp = new Date().toISOString();

        const locationData = {
          latitude,
          longitude,
          accuracy,
          speed,
          timestamp,
          source: 'foreground'
        };

        setCurrentLocation(locationData);

        // Send to Firebase (separate path from Python script)
        set(ref(db, "mobile_location"), locationData)
          .then(() => {
            console.log("Location sent to Firebase successfully");
          })
          .catch((error) => {
            console.error("Error sending to Firebase:", error);
          });
      }
    );

    // Start background location tracking if permission granted
    if (backgroundStatus.status === "granted") {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 seconds for background (same as foreground)
        distanceInterval: 0, // Update immediately when location changes
        foregroundService: {
          notificationTitle: "GPS Tracker Running",
          notificationBody: "Tracking your location every 5 seconds",
        },
      });
    }
  };

  const stopTracking = async () => {
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
    
    // Stop background location updates
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    
    setTracking(false);
    setCurrentLocation(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GPS Tracker App</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: tracking ? '#4CAF50' : '#F44336' }]}>
          {tracking ? "🟢 Tracking Active" : "🔴 Tracking Stopped"}
        </Text>
      </View>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Current Location:</Text>
          <Text style={styles.locationText}>Lat: {currentLocation.latitude.toFixed(6)}</Text>
          <Text style={styles.locationText}>Lng: {currentLocation.longitude.toFixed(6)}</Text>
          <Text style={styles.locationText}>Accuracy: {currentLocation.accuracy?.toFixed(2)}m</Text>
          <Text style={styles.locationText}>Speed: {currentLocation.speed?.toFixed(2)}m/s</Text>
          <Text style={styles.locationText}>Time: {new Date(currentLocation.timestamp).toLocaleTimeString()}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!tracking ? (
          <Button 
            title="Start GPS Tracking" 
            onPress={startTracking} 
            color="#4CAF50"
          />
        ) : (
          <Button 
            title="Stop GPS Tracking" 
            onPress={stopTracking} 
            color="#F44336"
          />
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 20,
  },
});
