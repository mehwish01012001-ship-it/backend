require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn('⚠️ Database initialization failed. Starting server without database connectivity.', error.message);
  }

  app.listen(PORT, () => {
    console.log(`\n✅ Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🔧 Admin URL: ${process.env.ADMIN_PANEL_URL || process.env.ADMIN_URL}\n`);
  });
};

startServer();