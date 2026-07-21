const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const connectDB = async () => {
  const uri = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_PROD_URI
    : process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠️ MongoDB connection string is not defined. Continuing without database connectivity.');
    return null;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. Continuing without database connectivity.', error.message);
    return null;
  }
};

module.exports = connectDB;
