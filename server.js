// require('dotenv').config();
// const app = require('./app');
// const connectDB = require('./config/database');

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();
//   } catch (error) {
//     console.warn('⚠️ Database initialization failed. Starting server without database connectivity.', error.message);
//   }

//   app.listen(PORT, () => {
//     console.log(`\n✅ Server is running on port ${PORT}`);
//     console.log(`📍 Environment: ${process.env.NODE_ENV}`);
//     console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
//     console.log(`🔧 Admin URL: ${process.env.ADMIN_PANEL_URL || process.env.ADMIN_URL}\n`);
//   });
// };

// startServer();







require("dotenv").config();

console.log("======================================");
console.log("🚀 RQ Fashion Backend Starting...");
console.log("--------------------------------------");
console.log("NODE_ENV      :", process.env.NODE_ENV || "development");
console.log("PORT          :", process.env.PORT || 5000);
console.log("FRONTEND_URL  :", process.env.FRONTEND_URL || "Not Set");
console.log(
  "ADMIN_URL     :",
  process.env.ADMIN_PANEL_URL || process.env.ADMIN_URL || "Not Set"
);
console.log("EMAIL_HOST    :", process.env.EMAIL_HOST || "Missing");
console.log("EMAIL_PORT    :", process.env.EMAIL_PORT || "Missing");
console.log("EMAIL_USER    :", process.env.EMAIL_USER ? "***" : "Missing");
console.log("======================================");

const app = require("./app");
const connectDB = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error");
    console.error(err.message);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("======================================");
    console.log(`✅ Server running on Port ${PORT}`);
    console.log(`🌍 Environment : ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend    : ${process.env.FRONTEND_URL}`);
    console.log(
      `🛠 Admin Panel : ${
        process.env.ADMIN_PANEL_URL || process.env.ADMIN_URL
      }`
    );
    console.log("======================================");
  });

  server.on("error", (err) => {
    console.error("❌ Server Error:", err);
  });
}

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection");
  console.error(err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception");
  console.error(err);
});

startServer();