const attendanceService = require('../services/attendanceService');
const store = require('../models/store');

exports.checkIn = (req, res) => {
  try {
    const { employeeId, latitude, longitude, accuracy, faceCount, faceDescriptor, livenessVerified, photoBase64, source } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Employee ID is required' });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'GPS coordinates (latitude, longitude) are required' });
    }

    const result = attendanceService.processAttendance({
      employeeId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy || 0),
      faceCount: Number(faceCount || 0),
      faceDescriptor,
      livenessVerified: Boolean(livenessVerified),
      type: 'CHECK_IN',
      source: source || 'camera',
      photoBase64
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error('Error processing check-in:', err);
    return res.status(500).json({ success: false, error: 'Server error processing check-in', details: err.message });
  }
};

exports.checkOut = (req, res) => {
  try {
    const { employeeId, latitude, longitude, accuracy, faceCount, faceDescriptor, livenessVerified, photoBase64, source } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Employee ID is required' });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'GPS coordinates (latitude, longitude) are required' });
    }

    const result = attendanceService.processAttendance({
      employeeId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy || 0),
      faceCount: Number(faceCount || 0),
      faceDescriptor,
      livenessVerified: Boolean(livenessVerified),
      type: 'CHECK_OUT',
      source: source || 'camera',
      photoBase64
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error('Error processing check-out:', err);
    return res.status(500).json({ success: false, error: 'Server error processing check-out', details: err.message });
  }
};

exports.getToday = (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'employeeId query parameter is required' });
    }
    const records = store.getTodayAttendanceForEmployee(employeeId);
    return res.json({ success: true, records, count: records.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getHistory = (req, res) => {
  try {
    const { employeeId, status, date, source } = req.query;
    const records = store.getAttendanceRecords({ employeeId, status, date, source });
    return res.json({ success: true, records, count: records.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStats = (req, res) => {
  try {
    const stats = store.getStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
