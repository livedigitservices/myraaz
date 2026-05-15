const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  checkEligibility,
  requestReturn,
  getAllReturns,
  handleReturn,
  getMyReturns,
  getUserWallet,
  handleRazorpayWebhook,
} = require('../controllers/returnController');

/* ── Static/named routes FIRST — before any /:param routes ── */

/* Webhooks — no auth */
router.post('/webhook/razorpay',              handleRazorpayWebhook);

/* Admin */
router.get('/admin',                protect, admin, getAllReturns);
router.put('/admin/:returnId',      protect, admin, handleReturn);

/* User — static paths before /:orderId */
router.get('/my',                   protect,        getMyReturns);
router.get('/wallet',               protect,        getUserWallet);
router.get('/eligibility/:orderId', protect,        checkEligibility);

/* ── Param route LAST ── */
router.post('/:orderId',            protect,        requestReturn);

module.exports = router;