const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@myraaz.com' });
    if (existing) {
      existing.isAdmin = true;
      await existing.save();
      console.log('✅ Existing user promoted to admin:', existing.email);
      process.exit();
    }

    // Create fresh admin
    const admin = await User.create({
      name:     'Admin',
      email:    'admin@myraaz.com',
      password: 'Admin@123',
      isAdmin:  true,
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email:   ', admin.email);
    console.log('   Password: Admin@123');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();