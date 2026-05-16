const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeIntent,
  verifyStripePayment,
  razorpayWebhook,
} = require('../controllers/paymentController');

// Webhook — no auth, raw body handled in server.js
router.post('/webhook/razorpay',      razorpayWebhook);

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify',       protect, verifyRazorpayPayment);
router.post('/stripe/create-intent',  protect, createStripeIntent);
router.post('/stripe/verify',         protect, verifyStripePayment);

// ❌ /wallet removed — wallet payment is handled atomically in orderController.placeOrder

module.exports = router;