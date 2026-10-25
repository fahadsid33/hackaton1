require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Attendance Server running on http://localhost:${PORT}`);
  console.log(`📍 Geofence, Face Detection & Liveness Engine active`);
  console.log(`🛡️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
