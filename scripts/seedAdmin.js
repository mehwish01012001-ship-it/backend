require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rq-fashion';
    await mongoose.connect(mongoUri);

    console.log('MongoDB connected for seeding...');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists!');
      console.log(`Email: ${adminExists.email}`);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@rqfashion.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@rqfashion.com');
    console.log('🔑 Password: Admin@123');
    console.log('\nUse these credentials to login to the admin panel.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
