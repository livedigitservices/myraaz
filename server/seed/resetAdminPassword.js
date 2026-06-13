/**
 * One-time script — resets the password for an existing admin account.
 *
 * Usage:
 *   cd server
 *   $env:ADMIN_EMAIL="admin@myraaz.com"
 *   $env:ADMIN_PASSWORD="YourNewStrongPass123"
 *   node seed/resetAdminPassword.js
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User = require('../models/User');

const run = async () => {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected...');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  user.password = password;   // pre('save') hook will hash it
  user.isAdmin  = true;
  await user.save();

  console.log(`✅ Password reset successfully for ${user.email}`);
  console.log(`   You can now log in with the new password.`);
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});