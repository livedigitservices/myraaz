const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
} = require('../controllers/paymentController');

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify',       protect, verifyRazorpayPayment);
router.post('/stripe/create-intent',  protect, createStripeIntent);
router.post('/stripe/verify',         protect, verifyStripePayment);

module.exports = router;