/**
 * One-time migration script — normalizes all existing user emails to lowercase.
 * Run once after deploying the updated authController.js.
 *
 * Usage:
 *   cd server
 *   node seed/normalizeEmails.js
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected...');

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    const lower = user.email.toLowerCase().trim();
    if (user.email !== lower) {
      // Check for collision before renaming
      const exists = await User.findOne({ email: lower, _id: { $ne: user._id } });
      if (exists) {
        console.warn(`⚠️  Skipping ${user.email} — lowercase version already exists (duplicate account).`);
        continue;
      }
      user.email = lower;
      await user.save();
      updated++;
      console.log(`Updated: ${user._id} -> ${lower}`);
    }
  }

  console.log(`\n✅ Done. ${updated} email(s) normalized out of ${users.length} total users.`);
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});