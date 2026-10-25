# GeoFace Mobile Attendance (React Native / Expo)

This is the mobile companion application for the GeoFace AI Camera & Geofence Attendance System.

## Features
- **Front Camera Live Stream & Face Presence**: Displays real-time camera preview with target guidance oval.
- **High-Accuracy GPS Geofencing**: Uses `expo-location` with `Accuracy.High` to read latitude, longitude, and accuracy. Rejects check-in if GPS accuracy is worse than 100 meters.
- **Server Distance Validation**: Telemetry is submitted to the backend server where the Haversine formula calculates distance against the Admin-configured office geofence.
- **Face Biometric Enrollment**: Dedicated screen to enroll 128-dimensional facial descriptors.
- **HR Correction Fallback**: In-app form to request HR corrections if GPS drift or camera detection fails.
- **Flexible Server Config**: Set backend server URL dynamically to your local IP or production domain.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI or Expo Go app on your physical iOS/Android phone

### Setup & Run
1. Change directory to `mobile`:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Expo development server:
   ```bash
   npm start
   ```
   Or for web preview:
   ```bash
   npm run web
   ```

4. **Connecting to the Local Server from a Physical Phone**:
   - Make sure your phone and development computer are on the same Wi-Fi network.
   - Open the **Config** tab in the mobile app.
   - Set the API URL to: `http://<YOUR_COMPUTER_LOCAL_IP>:5000` (e.g. `http://192.168.1.105:5000`).
   - If using Android Emulator, set API URL to: `http://10.0.2.2:5000`.
