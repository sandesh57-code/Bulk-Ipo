const express = require('express');
const {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all account routes

router.route('/')
  .get(getAccounts)
  .post(addAccount);

router.route('/:id')
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;
