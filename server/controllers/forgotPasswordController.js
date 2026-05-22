// controllers/forgotPasswordController.js
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { Resend } = require('resend');
const User       = require('../models/User');

const resend   = new Resend(process.env.RESEND_API_KEY);
const otpStore = new Map();

/* ── Helpers ── */
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendOTPEmail = async (email, otp) => {
  await resend.emails.send({
    from:    'myRaaz <onboarding@resend.dev>',
    to:      'helloworldhtml4@gmail.com', // replace with your Resend account email
    subject: 'Password Reset OTP – myRaaz',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                  border-radius:12px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 8px;color:#1a1a1a;">Password Reset</h2>
        <p style="color:#6b7280;margin:0 0 24px;">
          Use the OTP below to reset your password. Valid for <strong>10 minutes</strong>.
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;
                    text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1a1a1a;">
            ${otp}
          </span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;">
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};

/* ══════════════════════════
   STEP 1 — Send OTP
══════════════════════════ */
const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid email address' });

    const user = await User.findOne({ email });
    if (!user)
      // Always 200 to prevent email enumeration
      return res.status(200).json({ message: 'If this email is registered, an OTP has been sent.' });

    // Rate limit: allow resend only after 60s
    const existing = otpStore.get(email);
    if (existing && existing.expiresAt - 9 * 60 * 1000 > Date.now())
      return res.status(429).json({ message: 'Please wait before requesting a new OTP' });

    const otp       = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    otpStore.set(email, {
      hashedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified:  false,
      attempts:  0,
    });

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email address' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

/* ══════════════════════════
   STEP 2 — Verify OTP
══════════════════════════ */
const verifyResetOTP = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const record = otpStore.get(email);

    if (!record)
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(email);
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp, record.hashedOtp);
    if (!isValid) {
      record.attempts += 1;
      return res.status(400).json({
        message: `Invalid OTP. ${5 - record.attempts} attempt(s) remaining.`,
      });
    }

    // Mark verified, give 5 min window to reset
    record.verified  = true;
    record.expiresAt = Date.now() + 5 * 60 * 1000;

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('verifyResetOTP error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/* ══════════════════════════
   STEP 3 — Reset Password
══════════════════════════ */
const resetPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const record = otpStore.get(email);

    if (!record || !record.verified)
      return res.status(400).json({ message: 'Please complete OTP verification first' });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    const isValid = await bcrypt.compare(otp, record.hashedOtp);
    if (!isValid) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Invalid session. Please start over.' });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // ✅ Assign plain text — pre-save hook in User.js handles hashing automatically
    user.password = newPassword;
    await user.save();

    otpStore.delete(email);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = { forgotPassword, verifyResetOTP, resetPassword };