# GPS Tracker App - Build Instructions

## 📱 About the App

This is a React Native GPS tracking app built with Expo that:
- ✅ Tracks GPS location in real-time
- ✅ Sends location data to Firebase Realtime Database
- ✅ Has Start/Stop tracking buttons
- ✅ Shows current location details
- ✅ Can be built as an installable APK

## 🔧 Prerequisites

1. **Node.js** (v16 or later)
2. **Firebase Project** with Realtime Database enabled
3. **Expo Account** (free at expo.dev)

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Realtime Database**
4. Copy your Firebase config from Project Settings
5. Replace the config in `firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};
```

## 📦 Building the APK

### Method 1: Using EAS Build (Recommended)

1. **Create Expo Account** at https://expo.dev/signup

2. **Login to Expo**:
   ```bash
   npx eas-cli@latest login
   ```

3. **Configure EAS Build**:
   ```bash
   npx eas-cli@latest build:configure
   ```

4. **Build APK**:
   ```bash
   npx eas-cli@latest build --platform android --profile production
   ```

5. **Download**: Once build completes, you'll get a download link for your APK

### Method 2: Local Build (Requires Android Studio)

1. **Install Android Studio** and setup Android SDK
2. **Install Expo CLI locally**:
   ```bash
   npm install -g @expo/cli
   ```
3. **Generate Android project**:
   ```bash
   npx expo run:android
   ```

## 🧪 Testing Before Building

### Test on your phone:
```bash
npx expo start
```
Then scan QR code with Expo Go app.

### Test on Android emulator:
```bash
npx expo start --android
```

## 📂 Project Structure

```
GpsTrackerApp/
├── App.js              # Main app component with GPS tracking
├── firebase.js         # Firebase configuration
├── app.json           # Expo configuration
├── eas.json           # EAS Build configuration
└── package.json       # Dependencies
```

## 🔒 Permissions

The app requests these permissions:
- **ACCESS_FINE_LOCATION** - For GPS tracking
- **ACCESS_COARSE_LOCATION** - For network-based location
- **ACCESS_BACKGROUND_LOCATION** - For background tracking

## 🚀 Features

- **Real-time GPS tracking** with Start/Stop buttons
- **Firebase integration** - sends location every 5 seconds
- **Location display** - shows lat/lng, accuracy, speed
- **Background-ready** - can track when app is minimized
- **Professional UI** - clean, modern interface

## 🐛 Troubleshooting

### Build Issues:
- Make sure you're logged into Expo: `npx eas-cli@latest whoami`
- Check Firebase config is correct
- Ensure app.json has correct permissions

### Location Issues:
- Enable location permissions on device
- Test on real device (emulator GPS might not work)
- Check Firebase Realtime Database rules

### Firebase Connection:
- Verify internetconnection
- Check Firebase project is active
- Ensure Realtime Database URL is correct

## 📱 APK Installation

1. **Download APK** from EAS build or local build
2. **Enable Unknown Sources** in Android settings
3. **Install APK** by tapping the file
4. **Allow location permissions** when prompted

## 🔄 Updates

To update the app:
1. Modify code as needed
2. Update version in `app.json`
3. Run build command again
4. Distribute new APK

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Test app
npx expo start

# Build APK (after Expo login)
npx eas-cli@latest build --platform android --profile production
```

Your GPS tracking app is ready! 🚀
