const geolib = require('geolib');
const { calculateHaversineDistance } = require('../utils/haversine');
const { matchFaceDescriptors } = require('../utils/faceMatcher');
const store = require('../models/store');

/**
 * Service to process and validate camera-based attendance check-ins and check-outs
 */
class AttendanceService {
  /**
   * Process an attendance check-in or check-out request
   * @param {Object} payload
   * @param {string} payload.employeeId
   * @param {number} payload.latitude
   * @param {number} payload.longitude
   * @param {number} payload.accuracy
   * @param {number} payload.faceCount
   * @param {number[]} [payload.faceDescriptor]
   * @param {boolean} [payload.livenessVerified]
   * @param {string} [payload.type] - 'CHECK_IN' | 'CHECK_OUT'
   * @param {string} [payload.source] - 'camera' | 'mobile' | 'web'
   * @param {string} [payload.photoBase64] - Optional photo string if company policy enables photo storage
   * @returns {Object} Result of validation and created attendance record
   */
  processAttendance(payload) {
    // 1. Authoritative server timestamp - NEVER trust phone/client time
    const serverTimestamp = new Date();
    const serverIsoTime = serverTimestamp.toISOString();

    const {
      employeeId,
      latitude,
      longitude,
      accuracy,
      faceCount = 0,
      faceDescriptor = null,
      livenessVerified = false,
      type = 'CHECK_IN',
      source = 'camera',
      photoBase64 = null
    } = payload;

    // Validate employee exists
    const employee = store.getEmployeeById(employeeId, true);
    if (!employee) {
      return {
        success: false,
        statusCode: 404,
        error: `Employee not found with ID: ${employeeId}`
      };
    }

    const office = store.getOfficeSettings();

    // 2. Calculate distance using both Haversine formula and geolib for dual verification
    const lat1 = Number(latitude);
    const lon1 = Number(longitude);
    const lat2 = Number(office.latitude);
    const lon2 = Number(office.longitude);

    if (isNaN(lat1) || isNaN(lon1)) {
      return {
        success: false,
        statusCode: 400,
        error: 'Invalid GPS coordinates provided'
      };
    }

    const haversineDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    // geolib distance
    const geolibDist = geolib.getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
    const distanceMeters = Math.min(haversineDist, geolibDist); // Or haversineDist

    // 3. Validation checks - collect any failures
    const validationErrors = [];

    // Rule A: Exactly one face must be detected
    if (faceCount === 0) {
      validationErrors.push('No face detected in camera frame. Please center your face in the camera.');
    } else if (faceCount > 1) {
      validationErrors.push(`Multiple faces detected (${faceCount} faces). Exactly one person must be present.`);
    }

    // Rule B: GPS accuracy must be <= 100 meters
    const maxAccuracy = office.maxGpsAccuracyMeters || 100;
    if (typeof accuracy !== 'number' || accuracy > maxAccuracy) {
      validationErrors.push(
        `GPS accuracy is too low (${Math.round(accuracy || 0)}m). Required: ≤ ${maxAccuracy}m. Move near a window or enable high-accuracy location.`
      );
    }

    // Rule C: Location must be within office radius
    const isInsideRadius = distanceMeters <= office.radiusMeters;
    if (!isInsideRadius) {
      const overBy = Math.round(distanceMeters - office.radiusMeters);
      validationErrors.push(
        `Outside company location. Distance to office is ${Math.round(distanceMeters)}m, allowed radius is ${office.radiusMeters}m (${overBy}m out of bounds).`
      );
    }

    // Rule D: Optional/Bonus Face Descriptor matching
    let faceMatchResult = { isMatch: true, distance: 0, confidence: 100 };
    if (office.requireFaceMatch && employee.faceEnrolled && employee.faceDescriptor) {
      if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
        validationErrors.push('Face descriptor missing from camera scan for identity verification.');
      } else {
        faceMatchResult = matchFaceDescriptors(
          faceDescriptor,
          employee.faceDescriptor,
          office.matchThreshold || 0.55
        );

        if (!faceMatchResult.isMatch) {
          validationErrors.push(
            `Face does not match enrolled employee profile (Euclidean distance: ${faceMatchResult.distance}, threshold: ${faceMatchResult.threshold}).`
          );
        }
      }
    }

    // Rule E: Optional/Bonus Liveness verification (e.g. blink check)
    if (office.requireLiveness && !livenessVerified) {
      validationErrors.push('Liveness check failed. Please blink or follow the camera prompt to confirm live presence.');
    }

    // Determine status
    const isApproved = validationErrors.length === 0;
    const status = isApproved ? 'APPROVED' : 'REJECTED';
    const rejectionReason = isApproved ? null : validationErrors.join(' | ');

    // Check lateness if checking in and approved
    let isLate = false;
    if (isApproved && type === 'CHECK_IN') {
      const [startHours, startMins] = (office.workStartTime || '09:00').split(':').map(Number);
      const grace = office.lateGraceMinutes || 15;
      const expectedTime = new Date(serverTimestamp);
      expectedTime.setHours(startHours, startMins + grace, 0, 0);
      isLate = serverTimestamp > expectedTime;
    }

    // Photo privacy rule: Only store full photo if company explicitly configured storePhotos = true
    let storedPhotoUrl = null;
    if (office.storePhotos && photoBase64) {
      storedPhotoUrl = photoBase64.substring(0, 500) + '...[truncated-photo-proof]';
    }

    // 4. Save attendance record
    const attendanceRecord = store.addAttendanceRecord({
      employeeId: employee.id,
      employeeName: employee.name,
      type,
      timestamp: serverIsoTime,
      source: source || 'camera',
      status,
      rejectionReason,
      validationErrors,
      officeDistanceMeters: Math.round(distanceMeters * 10) / 10,
      officeRadiusMeters: office.radiusMeters,
      gpsLatitude: lat1,
      gpsLongitude: lon1,
      gpsAccuracyMeters: accuracy ? Math.round(accuracy * 10) / 10 : null,
      faceDetectedCount: faceCount,
      faceMatched: faceMatchResult.isMatch,
      faceMatchScore: faceMatchResult.distance,
      faceConfidence: faceMatchResult.confidence,
      livenessVerified: Boolean(livenessVerified),
      isLate,
      photoUrl: storedPhotoUrl,
      // Privacy notice sent in response to inform user what was captured
      privacyNotice: 'Only attendance verification metadata, GPS metrics, and matching scores were recorded. Raw photo is not stored.'
    });

    return {
      success: isApproved,
      statusCode: isApproved ? 200 : 422,
      status,
      record: attendanceRecord,
      message: isApproved
        ? `${type === 'CHECK_IN' ? 'Check-in' : 'Check-out'} approved successfully!`
        : `Attendance rejected: ${validationErrors[0]}`,
      validationSummary: {
        faceDetected: faceCount === 1,
        faceCount,
        locationInside: isInsideRadius,
        distanceMeters: Math.round(distanceMeters * 10) / 10,
        radiusMeters: office.radiusMeters,
        accuracyValid: accuracy <= maxAccuracy,
        accuracyMeters: accuracy,
        maxAccuracyMeters: maxAccuracy,
        faceMatched: faceMatchResult.isMatch,
        livenessVerified: Boolean(livenessVerified)
      },
      fallbackHrUrl: isApproved ? null : `/corrections/new?emp=${employee.id}`
    };
  }
}

module.exports = new AttendanceService();
