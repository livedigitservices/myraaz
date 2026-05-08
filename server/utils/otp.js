const otpStore = new Map(); // { phone: { otp, expiresAt } }

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit

const saveOTP = (phone, otp) => {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
};

const verifyOTP = (phone, otp) => {
  const record = otpStore.get(phone);
  if (!record) return { valid: false, message: 'OTP not found. Please request again.' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, message: 'OTP expired. Please request again.' };
  }
  if (record.otp !== otp) return { valid: false, message: 'Invalid OTP.' };
  otpStore.delete(phone); // one time use
  return { valid: true };
};

module.exports = { generateOTP, saveOTP, verifyOTP };