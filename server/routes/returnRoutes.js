const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  checkEligibility,
  requestReturn,
  getAllReturns,
  handleReturn,
} = require('../controllers/returnController');

/* User routes */
router.get('/eligibility/:orderId',  protect,        checkEligibility);
router.post('/:orderId',             protect,        requestReturn);

/* Admin routes */
router.get('/admin',                 protect, admin, getAllReturns);
router.put('/admin/:orderId',        protect, admin, handleReturn);

module.exports = router;