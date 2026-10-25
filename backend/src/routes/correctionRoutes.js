const express = require('express');
const router = express.Router();
const correctionController = require('../controllers/correctionController');

router.get('/', correctionController.getCorrections);
router.post('/', correctionController.createCorrection);
router.patch('/:id', correctionController.reviewCorrection);

module.exports = router;
