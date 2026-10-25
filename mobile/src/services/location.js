import * as Location from 'expo-location';

export async function requestLocationPermissions() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function fetchCurrentGps() {
  const isGranted = await requestLocationPermissions();
  if (!isGranted) {
    throw new Error('Location permission not granted. Please allow location access in settings.');
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High
  });

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    timestamp: pos.timestamp
  };
}

/**
 * Client-side distance preview calculation (Haversine)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
