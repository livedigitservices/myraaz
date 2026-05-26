const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayOrderStatus,
  createUpiQr,
  getQrPaymentStatus,
  verifyQrPayment,
  walletPay,
  razorpayWebhook,
} = require('../controllers/paymentController');

// ── Webhook — raw body handled in server.js BEFORE express.json() ──
router.post('/webhook/razorpay', razorpayWebhook);

// ── Razorpay standard checkout (cards / UPI collect / netbanking) ──
router.post('/razorpay/create-order',                  protect, createRazorpayOrder);
router.post('/razorpay/verify',                        protect, verifyRazorpayPayment);
router.get( '/razorpay/order-status/:razorpayOrderId', protect, getRazorpayOrderStatus);

// ── Razorpay UPI QR ──
router.post('/razorpay/create-upi-qr',   protect, createUpiQr);
router.get( '/razorpay/qr-status/:qrId', protect, getQrPaymentStatus);
router.post('/razorpay/verify-qr',       protect, verifyQrPayment);

// ── Wallet ──
router.post('/wallet', protect, walletPay);

module.exports = router;