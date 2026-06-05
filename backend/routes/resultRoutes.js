const express = require('express');
const { bulkCheckResults } = require('../controllers/resultController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/bulk-check', bulkCheckResults);

module.exports = router;
