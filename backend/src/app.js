const express = require('express');
const cors = require('cors');

const attendanceRoutes = require('./routes/attendanceRoutes');
const officeRoutes = require('./routes/officeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const correctionRoutes = require('./routes/correctionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Camera & Geofence Attendance API'
  });
});

// API Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/corrections', correctionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
