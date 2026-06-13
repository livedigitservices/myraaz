const express = require('express');
const router  = express.Router();

const { register, login }            = require('../controllers/authController');
const { sendOTP, verifyOTPAndLogin } = require('../controllers/otpController');
const {
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require('../controllers/forgotPasswordController');

// Rate limit auth endpoints to prevent brute force
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  // Fallback no-op if package not installed yet
  rateLimit = () => (req, res, next) => next();
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,
  message:  { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max:      5,
  message:  { message: 'Too many OTP requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

router.post('/register',         loginLimiter, register);
router.post('/login',            loginLimiter, login);
router.post('/send-otp',         otpLimiter,   sendOTP);
router.post('/verify-otp',       otpLimiter,   verifyOTPAndLogin);

// Forgot password flow
router.post('/forgot-password',  otpLimiter,   forgotPassword);
router.post('/verify-reset-otp', otpLimiter,   verifyResetOTP);
router.post('/reset-password',   loginLimiter, resetPassword);

module.exports = router;