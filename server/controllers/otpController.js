const jwt    = require('jsonwebtoken');
const https  = require('https');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User   = require('../models/User');

const TOKEN_EXPIRY = '7d'; // unified with authController

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

const PHONE_OTP_FIELDS = '+phoneOtp +phoneOtpExpiry +phoneOtpAttempts';

/* ── Send SMS via 2Factor.in ── */
const sendSMS = (phone, otp) => {
  return new Promise((resolve, reject) => {
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');
    const apiKey     = process.env.TWOFACTOR_API_KEY;
    const path       = `/API/V1/${apiKey}/SMS/${cleanPhone}/${otp}`;

    const options = { hostname: '2factor.in', path, method: 'POST' };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('2Factor response:', JSON.stringify(parsed, null, 2));
          if (parsed.Status === 'Success') resolve(parsed);
          else reject(new Error(parsed.Details || 'SMS sending failed'));
        } catch {
          reject(new Error('Invalid response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

/* ── POST /api/auth/send-otp ── */
const sendOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^\d{10}$/.test(phone.replace(/\s/g, '')))
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });

  try {
    const formattedPhone = `+91${phone.replace(/\s/g, '')}`;

    // Find or build user to store OTP in DB
    let user = await User.findOne({ phone: formattedPhone }).select(PHONE_OTP_FIELDS);

    // Rate-limit: block if OTP was sent less than 60 seconds ago
    if (user?.phoneOtpExpiry && Date.now() < user.phoneOtpExpiry - 4 * 60 * 1000) {
      return res.status(429).json({ message: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    const otp       = crypto.randomInt(100000, 999999).toString();
    const hashed    = await bcrypt.hash(otp, 10);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Persist OTP in DB (upsert approach — user may not exist yet)
    if (user) {
      await User.findOneAndUpdate({ phone: formattedPhone }, {
        $set: { phoneOtp: hashed, phoneOtpExpiry: expiresAt, phoneOtpAttempts: 0 },
      });
    } else {
      // Store temporarily against phone in a pending doc — will be finalized on verify
      // For simplicity, store against a placeholder if user doesn't exist yet
      // We persist in a temporary way: findOneAndUpdate with upsert on phone
      await User.findOneAndUpdate(
        { phone: formattedPhone },
        {
          $set:        { phoneOtp: hashed, phoneOtpExpiry: expiresAt, phoneOtpAttempts: 0 },
          $setOnInsert: {
            name:        `User${phone.slice(-4)}`,
            email:       `phone_${phone.replace(/\s/g, '')}_${Date.now()}@placeholder.com`,
            password:    `PHONE_AUTH_${Date.now()}`,
            phone:       formattedPhone,
            isPhoneUser: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    if (!process.env.TWOFACTOR_API_KEY) {
      // Dev fallback — OTP only in terminal, NEVER in response body
      console.log('\n================================');
      console.log(`📱 OTP for ${formattedPhone}: ${otp}`);
      console.log('================================\n');
      return res.json({
        message: 'OTP generated (check terminal — no SMS key configured)',
        phone:   formattedPhone,
      });
    }

    await sendSMS(phone.replace(/\s/g, ''), otp);
    console.log(`✅ OTP sent successfully to ${formattedPhone}`);

    res.json({
      message: 'OTP sent successfully to your mobile number',
      phone:   formattedPhone,
    });

  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: `Failed to send OTP: ${err.message}` });
  }
};

/* ── POST /api/auth/verify-otp ── */
const verifyOTPAndLogin = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp)
    return res.status(400).json({ message: 'Phone and OTP are required' });

  const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\s/g, '')}`;

  try {
    const user = await User.findOne({ phone: formattedPhone }).select(PHONE_OTP_FIELDS);

    if (!user || !user.phoneOtp)
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });

    if (Date.now() > user.phoneOtpExpiry) {
      await User.findOneAndUpdate({ phone: formattedPhone }, {
        $unset: { phoneOtp: '', phoneOtpExpiry: '' },
        $set:   { phoneOtpAttempts: 0 },
      });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    if ((user.phoneOtpAttempts ?? 0) >= 5) {
      await User.findOneAndUpdate({ phone: formattedPhone }, {
        $unset: { phoneOtp: '', phoneOtpExpiry: '' },
        $set:   { phoneOtpAttempts: 0 },
      });
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp, user.phoneOtp);

    if (!isValid) {
      await User.findOneAndUpdate({ phone: formattedPhone }, {
        $inc: { phoneOtpAttempts: 1 },
      });
      const remaining = 5 - ((user.phoneOtpAttempts ?? 0) + 1);
      return res.status(400).json({ message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    // Clear OTP fields after successful verification
    await User.findOneAndUpdate({ phone: formattedPhone }, {
      $unset: { phoneOtp: '', phoneOtpExpiry: '' },
      $set:   { phoneOtpAttempts: 0 },
    });

    res.json({
      _id:         user._id,
      name:        user.name,
      email:       user.isPhoneUser ? '' : user.email,
      phone:       user.phone,
      isAdmin:     user.isAdmin,
      isPhoneUser: user.isPhoneUser,
      token:       generateToken(user._id),
    });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendOTP, verifyOTPAndLogin };