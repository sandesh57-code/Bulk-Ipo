const express = require('express');
const {
  getIPOs,
  getIPO,
  bulkApplyIPO,
} = require('../controllers/ipoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all IPO routes

router.get('/', getIPOs);
router.get('/:id', getIPO);
router.post('/bulk-apply', bulkApplyIPO);

module.exports = router;
