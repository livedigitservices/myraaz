const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
  payWithWallet,
  razorpayWebhook,
} = require('../controllers/paymentController');

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify',       protect, verifyRazorpayPayment);
router.post('/stripe/create-intent',  protect, createStripeIntent);
router.post('/stripe/verify',         protect, verifyStripePayment);
router.post('/wallet',                protect, payWithWallet);
router.post('/webhook/razorpay',      razorpayWebhook);

module.exports = router;