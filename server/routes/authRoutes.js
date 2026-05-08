const express = require('express');
const router  = express.Router();
const { register, login }             = require('../controllers/authController');
const { sendOTP, verifyOTPAndLogin }  = require('../controllers/otpController');

router.post('/register',   register);
router.post('/login',      login);
router.post('/send-otp',   sendOTP);
router.post('/verify-otp', verifyOTPAndLogin);

module.exports = router;