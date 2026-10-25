const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/today', attendanceController.getToday);
router.get('/history', attendanceController.getHistory);
router.get('/stats', attendanceController.getStats);

module.exports = router;
