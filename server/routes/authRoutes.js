const express = require('express');
const router  = express.Router();
const { register, login }            = require('../controllers/authController');
const { sendOTP, verifyOTPAndLogin } = require('../controllers/otpController');
const {
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require('../controllers/forgotPasswordController');

router.post('/register',        register);
router.post('/login',           login);
router.post('/send-otp',        sendOTP);
router.post('/verify-otp',      verifyOTPAndLogin);

// Forgot password flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp',verifyResetOTP);
router.post('/reset-password',  resetPassword);

module.exports = router;