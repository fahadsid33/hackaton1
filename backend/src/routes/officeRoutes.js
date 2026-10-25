const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');

router.get('/', officeController.getOfficeSettings);
router.put('/', officeController.updateOfficeSettings);
router.post('/test-geofence', officeController.testGeofence);

module.exports = router;
