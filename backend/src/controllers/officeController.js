const store = require('../models/store');
const { calculateHaversineDistance } = require('../utils/haversine');

exports.getOfficeSettings = (req, res) => {
  try {
    const office = store.getOfficeSettings();
    return res.json({ success: true, office });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateOfficeSettings = (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      radiusMeters,
      maxGpsAccuracyMeters,
      workStartTime,
      workEndTime,
      lateGraceMinutes,
      requireFaceMatch,
      requireLiveness,
      storePhotos,
      matchThreshold
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = String(name);
    if (address !== undefined) updates.address = String(address);
    if (latitude !== undefined) updates.latitude = Number(latitude);
    if (longitude !== undefined) updates.longitude = Number(longitude);
    if (radiusMeters !== undefined) updates.radiusMeters = Math.max(10, Number(radiusMeters));
    if (maxGpsAccuracyMeters !== undefined) updates.maxGpsAccuracyMeters = Math.max(10, Number(maxGpsAccuracyMeters));
    if (workStartTime !== undefined) updates.workStartTime = String(workStartTime);
    if (workEndTime !== undefined) updates.workEndTime = String(workEndTime);
    if (lateGraceMinutes !== undefined) updates.lateGraceMinutes = Number(lateGraceMinutes);
    if (requireFaceMatch !== undefined) updates.requireFaceMatch = Boolean(requireFaceMatch);
    if (requireLiveness !== undefined) updates.requireLiveness = Boolean(requireLiveness);
    if (storePhotos !== undefined) updates.storePhotos = Boolean(storePhotos);
    if (matchThreshold !== undefined) updates.matchThreshold = Number(matchThreshold);

    const updated = store.updateOfficeSettings(updates);
    return res.json({ success: true, message: 'Office settings updated successfully', office: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Utility endpoint: Admin/tester can send test coordinates and get instant distance & geofence status
 */
exports.testGeofence = (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'latitude and longitude are required' });
    }
    const office = store.getOfficeSettings();
    const distance = calculateHaversineDistance(
      Number(latitude),
      Number(longitude),
      Number(office.latitude),
      Number(office.longitude)
    );
    const isInside = distance <= office.radiusMeters;

    return res.json({
      success: true,
      testPoint: { latitude: Number(latitude), longitude: Number(longitude) },
      office: { latitude: office.latitude, longitude: office.longitude, radiusMeters: office.radiusMeters },
      distanceMeters: distance,
      isInside,
      message: isInside
        ? `Inside office perimeter (${distance}m <= ${office.radiusMeters}m)`
        : `Outside office perimeter (${distance}m > ${office.radiusMeters}m)`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
