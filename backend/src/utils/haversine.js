/**
 * Haversine formula calculation for distance between two geographic coordinates
 * Radius of Earth = 6,371,000 meters
 */

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters rounded to 2 decimal places
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    throw new Error('All coordinates must be valid numbers');
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Checks if a point is within a given radius of a target center
 * @param {{latitude: number, longitude: number}} point
 * @param {{latitude: number, longitude: number}} center
 * @param {number} radiusMeters
 * @returns {{isInside: boolean, distance: number}}
 */
function isWithinGeofence(point, center, radiusMeters) {
  const distance = calculateHaversineDistance(
    point.latitude,
    point.longitude,
    center.latitude,
    center.longitude
  );

  return {
    isInside: distance <= radiusMeters,
    distance,
    radiusMeters,
    difference: Math.round((distance - radiusMeters) * 100) / 100
  };
}

module.exports = {
  calculateHaversineDistance,
  isWithinGeofence,
  EARTH_RADIUS_METERS
};
