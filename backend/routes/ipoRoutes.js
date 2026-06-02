const express = require('express');
const {
  getIPOs,
  getIPO,
  bulkApplyIPO,
} = require('../controllers/ipoController');
const { syncIPOs, getSyncStatus } = require('../controllers/ipoSyncController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all IPO routes

// Sync endpoints (must come before /:id to avoid clash)
router.post('/sync', syncIPOs);
router.get('/sync/status', getSyncStatus);

// Standard CRUD
router.get('/', getIPOs);
router.get('/:id', getIPO);
router.post('/bulk-apply', bulkApplyIPO);

module.exports = router;
