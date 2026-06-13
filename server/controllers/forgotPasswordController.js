/**
 * forgotPasswordController.js
 *
 * FIX: OTP was stored in an in-memory Map — data lost on every server restart/cold start
 * (critical on Vercel's serverless). Replaced with User model fields: resetOtpHash,
 * resetOtpExpiry, resetOtpAttempts, resetOtpVerified. These persist in MongoDB.
 *
 * Also: password minimum length unified to 6 chars (matches User model schema).
 */

const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { Resend } = require('resend');
const User       = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP    = () => crypto.randomInt(100000, 999999).toString();
const isValidEmail   = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const sendOTPEmail = async (email, otp) => {
  await resend.emails.send({
    from:    `myRaaz <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
    to:      email,
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

/* STEP 1 — Send OTP */
const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !isValidEmail(email))
      return res.status(400).json({ message: 'Invalid email address' });

    const user = await User.findOne({ email });
    // Always return the same message to prevent email enumeration
    if (!user)
      return res.status(200).json({ message: 'If this email is registered, an OTP has been sent.' });

    // Rate limit: block if OTP was sent less than 60 seconds ago
    if (user.resetOtpExpiry && Date.now() < user.resetOtpExpiry - 9 * 60 * 1000) {
      return res.status(429).json({ message: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    const otp      = generateOTP();
    const hashed   = await bcrypt.hash(otp, 10);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

    // Persist OTP in DB — survives serverless cold starts
    user.resetOtpHash     = hashed;
    user.resetOtpExpiry   = expiresAt;
    user.resetOtpAttempts = 0;
    user.resetOtpVerified = false;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email address.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

/* STEP 2 — Verify OTP */
const verifyResetOTP = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required.' });

    const user = await User.findOne({ email });
    if (!user || !user.resetOtpHash)
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });

    if (Date.now() > user.resetOtpExpiry) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.resetOtpAttempts >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const isValid = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isValid) {
      user.resetOtpAttempts += 1;
      await user.save();
      return res.status(400).json({
        message: `Invalid OTP. ${5 - user.resetOtpAttempts} attempt(s) remaining.`,
      });
    }

    // Mark verified, extend session by 5 min for password reset step
    user.resetOtpVerified = true;
    user.resetOtpExpiry   = Date.now() + 5 * 60 * 1000;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('verifyResetOTP error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

/* STEP 3 — Reset Password */
const resetPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const user = await User.findOne({ email });

    if (!user || !user.resetOtpVerified || !user.resetOtpHash)
      return res.status(400).json({ message: 'Please complete OTP verification first.' });

    if (Date.now() > user.resetOtpExpiry) {
      user.resetOtpHash = undefined;
      await user.save();
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    const isValid = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isValid) {
      user.resetOtpHash = undefined;
      await user.save();
      return res.status(400).json({ message: 'Invalid session. Please start over.' });
    }

    // Clear OTP fields before saving new password
    user.password         = newPassword;
    user.resetOtpHash     = undefined;
    user.resetOtpExpiry   = undefined;
    user.resetOtpAttempts = undefined;
    user.resetOtpVerified = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = { forgotPassword, verifyResetOTP, resetPassword };