import React, { useState, useRef, useEffect } from "react";
import { View, Button, Text, StyleSheet, Alert, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from 'expo-status-bar';
import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';
import { db, ref, set, push } from "./firebase";
import { get } from "firebase/database";

const LOCATION_TASK_NAME = 'background-location-task';

// Global variable to store current driver info for background task
let currentDriverInfo = null;

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location && currentDriverInfo) {
      const { latitude, longitude, accuracy, speed } = location.coords;
      const timestamp = new Date().toISOString();

      const locationData = {
        latitude,
        longitude,
        accuracy,
        speed,
        timestamp,
        source: 'background',
        driverId: currentDriverInfo.id,
        driverUsername: currentDriverInfo.username,
        driverName: currentDriverInfo.name
      };

      // Send to driver-specific Firebase path using driver ID
      const locationRef = ref(db, `drivers/registered/${currentDriverInfo.id}/locations`);
      push(locationRef, locationData)
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const watchId = useRef(null);

  // Update global driver info when driver logs in
  useEffect(() => {
    currentDriverInfo = driverInfo;
  }, [driverInfo]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login for username:", username.trim());
      
      // Get all registered drivers
      const driversRef = ref(db, 'drivers/registered');
      const driversSnapshot = await get(driversRef);
      
      if (!driversSnapshot.exists()) {
        Alert.alert("Error", "No registered drivers found");
        setIsLoading(false);
        return;
      }

      const allDrivers = driversSnapshot.val();
      let foundDriver = null;
      let driverId = null;

      // Search through all drivers to find matching username
      for (const [id, driverData] of Object.entries(allDrivers)) {
        if (driverData.username === username.trim()) {
          foundDriver = driverData;
          driverId = id;
          console.log("Found user with ID:", id);
          break;
        }
      }
      
      if (!foundDriver) {
        console.log("Username not found in registered drivers");
        Alert.alert("Error", "Username not found. Please check your username.");
        setIsLoading(false);
        return;
      }

      // Check password
      if (foundDriver.password !== password.trim()) {
        console.log("Password did not match");
        Alert.alert("Error", "Invalid password");
        setIsLoading(false);
        return;
      }

      // Check if driver is active
      if (!foundDriver.isActive) {
        Alert.alert("Error", "Your account has been deactivated. Please contact admin.");
        setIsLoading(false);
        return;
      }

      const driver = {
        id: driverId,
        username: foundDriver.username,
        name: foundDriver.name,
        phone: foundDriver.phone || '',
        busNumber: foundDriver.busNumber || '',
        loginTime: new Date().toISOString()
      };

      console.log("Login successful for driver:", driver);

      // Update driver status to online and last login time
      await set(ref(db, `drivers/registered/${driverId}/lastActive`), driver.loginTime);
      await set(ref(db, `drivers/registered/${driverId}/status`), 'online');
      
      setDriverInfo(driver);
      setIsLoggedIn(true);
      setIsLoading(false);
      Alert.alert("Login Successful", `Welcome ${driver.name}!\nBus: ${driver.busNumber}`);
      
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Error", "Failed to login. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Stop tracking if active
    if (tracking) {
      await stopTracking();
    }

    // Update driver status to offline
    if (driverInfo) {
      try {
        await set(ref(db, `drivers/registered/${driverInfo.id}/status`), 'offline');
        await set(ref(db, `drivers/registered/${driverInfo.id}/lastActive`), new Date().toISOString());
      } catch (error) {
        console.error("Error updating driver status:", error);
      }
    }

    setIsLoggedIn(false);
    setDriverInfo(null);
    setUsername('');
    setPassword('');
    setCurrentLocation(null);
    currentDriverInfo = null;
  };

  const startTracking = async () => {
    if (!driverInfo) {
      Alert.alert("Error", "Please login first");
      return;
    }

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
        timeInterval: 5000, // 5 seconds
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
          source: 'foreground',
          driverId: driverInfo.id,
          driverUsername: driverInfo.username,
          driverName: driverInfo.name,
          busNumber: driverInfo.busNumber
        };

        setCurrentLocation(locationData);

        // Send to driver-specific Firebase path using driver ID
        const locationRef = ref(db, `drivers/registered/${driverInfo.id}/locations`);
        push(locationRef, locationData)
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
        timeInterval: 5000, // 5 seconds
        distanceInterval: 0,
        foregroundService: {
          notificationTitle: `GPS Tracker - ${driverInfo.name}`,
          notificationBody: `Tracking location for Bus ${driverInfo.busNumber}`,
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

  // Login Screen Component
  const renderLoginScreen = () => (
    <ScrollView contentContainerStyle={styles.loginContainer}>
      <Text style={styles.title}>Bus Driver Login</Text>
      <Text style={styles.subtitle}>GPS Tracker App</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your username"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Main Tracking Screen Component
  const renderTrackingScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Tracker</Text>
        <View style={styles.driverInfo}>
          <Text style={styles.driverText}>Driver: {driverInfo.name}</Text>
          <Text style={styles.driverText}>Username: {driverInfo.username}</Text>
          <Text style={styles.driverText}>Bus: {driverInfo.busNumber}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: tracking ? '#4CAF50' : '#F44336' }]}>
          {tracking ? "🟢 Tracking Active" : "🔴 Tracking Stopped"}
        </Text>
      </View>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Current Location:</Text>
          <Text style={styles.locationText}>Driver: {currentLocation.driverName}</Text>
          {currentLocation.busNumber ? <Text style={styles.locationText}>Bus: {currentLocation.busNumber}</Text> : null}
          <Text style={styles.locationText}>Lat: {currentLocation.latitude.toFixed(6)}</Text>
          <Text style={styles.locationText}>Lng: {currentLocation.longitude.toFixed(6)}</Text>
          <Text style={styles.locationText}>Accuracy: {currentLocation.accuracy?.toFixed(2)}m</Text>
          <Text style={styles.locationText}>Speed: {currentLocation.speed?.toFixed(2)}m/s</Text>
          <Text style={styles.locationText}>Time: {new Date(currentLocation.timestamp).toLocaleTimeString()}</Text>
          <Text style={styles.locationText}>Source: {currentLocation.source}</Text>
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
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      {!isLoggedIn ? renderLoginScreen() : renderTrackingScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  driverInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  driverText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
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
