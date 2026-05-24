const express = require('express');
const {
  seedIPOs,
  getSystemStats,
  getUsers,
  updateUserStatus,
  createIPO,
  updateIPO,
  deleteIPO,
  publishIPOResult,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // restrict to admins only

router.post('/seed-ipos', seedIPOs);
router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

router.route('/ipos')
  .post(createIPO);

router.route('/ipos/:id')
  .put(updateIPO)
  .delete(deleteIPO);

router.post('/ipos/:id/publish-result', publishIPOResult);

module.exports = router;
