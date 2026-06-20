const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayOrderStatus,
  razorpayWebhook,
} = require('../controllers/paymentController');

/* Webhook — raw body handled in server.js BEFORE express.json() */
router.post('/webhook/razorpay', razorpayWebhook);

/* Razorpay standard checkout (UPI / cards / netbanking) */
router.post('/razorpay/create-order',                  protect, createRazorpayOrder);
router.post('/razorpay/verify',                        protect, verifyRazorpayPayment);
router.get( '/razorpay/order-status/:razorpayOrderId', protect, getRazorpayOrderStatus);

/* Wallet  → handled inside orderController.placeOrder (no separate route) */
/* QR code → feature removed                                                 */

module.exports = router;