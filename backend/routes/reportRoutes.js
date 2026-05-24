const express = require('express');
const { getReports, retryApplication } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getReports);
router.post('/:id/retry', retryApplication);

module.exports = router;
