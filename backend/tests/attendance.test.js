const test = require('node:test');
const assert = require('node:assert');
const { calculateHaversineDistance, isWithinGeofence } = require('../src/utils/haversine');
const { calculateEuclideanDistance, matchFaceDescriptors } = require('../src/utils/faceMatcher');
const attendanceService = require('../src/services/attendanceService');
const store = require('../src/models/store');

test('Haversine formula calculates known distances accurately', () => {
  // Office location
  const office = { latitude: 37.789172, longitude: -122.401449 };
  // A point ~40 meters away
  const nearby = { latitude: 37.7894, longitude: -122.4012 };
  
  const distance = calculateHaversineDistance(office.latitude, office.longitude, nearby.latitude, nearby.longitude);
  assert.ok(distance > 20 && distance < 60, `Distance ${distance}m should be between 20m and 60m`);
  
  const geofence = isWithinGeofence(nearby, office, 150);
  assert.strictEqual(geofence.isInside, true);

  // A point 10 km away
  const farAway = { latitude: 37.85, longitude: -122.3 };
  const farDistance = calculateHaversineDistance(office.latitude, office.longitude, farAway.latitude, farAway.longitude);
  assert.ok(farDistance > 8000, `Distance ${farDistance}m should be > 8000m`);
  const farGeofence = isWithinGeofence(farAway, office, 150);
  assert.strictEqual(farGeofence.isInside, false);
});

test('Face matcher calculates Euclidean distance correctly', () => {
  const v1 = [0.1, 0.2, 0.3];
  const v2 = [0.1, 0.2, 0.3];
  assert.strictEqual(calculateEuclideanDistance(v1, v2), 0);

  const descA = new Array(128).fill(0.1);
  const descB = new Array(128).fill(0.1);
  const resultExact = matchFaceDescriptors(descA, descB, 0.55);
  assert.strictEqual(resultExact.isMatch, true);
  assert.strictEqual(resultExact.distance, 0);

  const descDifferent = new Array(128).fill(0.9);
  const resultDiff = matchFaceDescriptors(descA, descDifferent, 0.55);
  assert.strictEqual(resultDiff.isMatch, false);
  assert.ok(resultDiff.distance > 0.55);
});

test('Attendance rejected if no face or multiple faces detected', () => {
  const office = store.getOfficeSettings();
  
  // Case 0 faces
  const zeroFace = attendanceService.processAttendance({
    employeeId: 'EMP-001',
    latitude: office.latitude,
    longitude: office.longitude,
    accuracy: 15,
    faceCount: 0,
    livenessVerified: true
  });
  assert.strictEqual(zeroFace.success, false);
  assert.strictEqual(zeroFace.status, 'REJECTED');
  assert.ok(zeroFace.record.rejectionReason.includes('No face detected'));

  // Case 2 faces
  const multiFace = attendanceService.processAttendance({
    employeeId: 'EMP-001',
    latitude: office.latitude,
    longitude: office.longitude,
    accuracy: 15,
    faceCount: 2,
    livenessVerified: true
  });
  assert.strictEqual(multiFace.success, false);
  assert.strictEqual(multiFace.status, 'REJECTED');
  assert.ok(multiFace.record.rejectionReason.includes('Multiple faces'));
});

test('Attendance rejected if GPS accuracy is worse than 100m', () => {
  const office = store.getOfficeSettings();

  const poorGps = attendanceService.processAttendance({
    employeeId: 'EMP-001',
    latitude: office.latitude,
    longitude: office.longitude,
    accuracy: 125, // > 100m limit
    faceCount: 1,
    livenessVerified: true
  });
  assert.strictEqual(poorGps.success, false);
  assert.strictEqual(poorGps.status, 'REJECTED');
  assert.ok(poorGps.record.rejectionReason.includes('GPS accuracy is too low'));
});

test('Attendance rejected if location is outside office radius', () => {
  const office = store.getOfficeSettings();

  const outsideLocation = attendanceService.processAttendance({
    employeeId: 'EMP-001',
    latitude: office.latitude + 0.05, // ~5 km away
    longitude: office.longitude + 0.05,
    accuracy: 20,
    faceCount: 1,
    livenessVerified: true
  });
  assert.strictEqual(outsideLocation.success, false);
  assert.strictEqual(outsideLocation.status, 'REJECTED');
  assert.ok(outsideLocation.record.rejectionReason.includes('Outside company location'));
});

test('Attendance approved when face is single, inside radius, GPS accurate, and liveness verified', () => {
  const office = store.getOfficeSettings();
  const emp = store.getEmployeeById('EMP-001', true);

  const validCheckIn = attendanceService.processAttendance({
    employeeId: 'EMP-001',
    latitude: office.latitude,
    longitude: office.longitude,
    accuracy: 15,
    faceCount: 1,
    faceDescriptor: emp.faceDescriptor,
    livenessVerified: true,
    type: 'CHECK_IN',
    source: 'camera'
  });

  assert.strictEqual(validCheckIn.success, true);
  assert.strictEqual(validCheckIn.status, 'APPROVED');
  assert.strictEqual(validCheckIn.record.employeeName, 'Alex Morgan');
  assert.strictEqual(validCheckIn.record.source, 'camera');
  assert.ok(validCheckIn.record.officeDistanceMeters <= office.radiusMeters);
  assert.ok(validCheckIn.record.timestamp);
});
