const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User = require('../models/User');

/**
 * Usage:
 *   ADMIN_EMAIL=admin@myraaz.com ADMIN_PASSWORD=YourStrongPass123 node seed/adminSeed.js
 *
 * Or set ADMIN_EMAIL and ADMIN_PASSWORD in your .env for local runs.
 * NEVER commit actual credentials to source control.
 */
const createAdmin = async () => {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('   Run: ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD=YourPass node seed/adminSeed.js');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    const existing = await User.findOne({ email });
    if (existing) {
      existing.isAdmin = true;
      await existing.save();
      console.log('✅ Existing user promoted to admin:', existing.email);
      process.exit(0);
    }

    const admin = await User.create({ name: 'Admin', email, password, isAdmin: true });
    console.log('✅ Admin created successfully!');
    console.log('   Email:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();