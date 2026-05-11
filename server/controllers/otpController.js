const jwt   = require('jsonwebtoken');
const https = require('https');
const User  = require('../models/User');
const { generateOTP, saveOTP, verifyOTP } = require('../utils/otp');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

/* ── Send SMS via 2Factor.in ── */
const sendSMS = (phone, otp) => {
  return new Promise((resolve, reject) => {
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');
    const apiKey     = process.env.TWOFACTOR_API_KEY;
    const path = `/API/V1/${apiKey}/SMS/${cleanPhone}/${otp}/AUTOGEN`;

    const options = {
      hostname: '2factor.in',
      path,
      method:  'GET',
    };

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
    const otp            = generateOTP();
    const formattedPhone = `+91${phone.replace(/\s/g, '')}`;
    const plainPhone     = phone.replace(/\s/g, '');

    saveOTP(formattedPhone, otp);

    if (!process.env.TWOFACTOR_API_KEY) {
      /* No API key — dev fallback */
      console.log('\n================================');
      console.log(`📱 OTP for ${formattedPhone}: ${otp}`);
      console.log('================================\n');
      return res.json({
        message: 'OTP generated (check terminal — no SMS key found)',
        phone:   formattedPhone,
        devOtp:  otp,
      });
    }

    await sendSMS(plainPhone, otp);
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

  const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

  const result = verifyOTP(formattedPhone, otp);
  if (!result.valid)
    return res.status(400).json({ message: result.message });

  try {
    let user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      /* New phone user — email is empty, user fills it later */
      user = await User.create({
        name:        `User${phone.slice(-4)}`,
        email:       `phone_${phone}_${Date.now()}@placeholder.com`,
        password:    `PHONE_AUTH_${Date.now()}`,
        phone:       formattedPhone,
        isPhoneUser: true,
      });
    }

    res.json({
      _id:         user._id,
      name:        user.name,
      /* Send empty string if phone user so frontend shows blank */
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