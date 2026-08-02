// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");

// const nodemailer = require("nodemailer");

// const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
// const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
// const EMAIL_USER = process.env.EMAIL_USER;
// const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

// const EMAIL_SECURE =
//   process.env.EMAIL_SECURE === "true" || EMAIL_PORT === 465;

// console.log("======================================");
// console.log("📧 SMTP Configuration");
// console.log("--------------------------------------");
// console.log("Host      :", EMAIL_HOST);
// console.log("Port      :", EMAIL_PORT);
// console.log("Secure    :", EMAIL_SECURE);
// console.log("User      :", EMAIL_USER ? "***" : "MISSING");
// console.log("======================================");

// const transporter = nodemailer.createTransport({
//   host: EMAIL_HOST,

//   port: EMAIL_PORT,

//   secure: EMAIL_SECURE,

//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASS,
//   },

//   requireTLS: !EMAIL_SECURE,

//   tls: {
//     rejectUnauthorized: false,
//     minVersion: "TLSv1.2",
//     servername: EMAIL_HOST,
//   },




//   family: 4,

//   connectionTimeout: 60000,
//   greetingTimeout: 60000,
//   socketTimeout: 60000,

//   logger: true,
//   debug: false,
// });

// (async () => {
//   try {
//     await transporter.verify();

//     console.log("======================================");
//     console.log("✅ SMTP Ready");
//     console.log("======================================");
//   } catch (err) {
//     console.error("======================================");
//     console.error("❌ SMTP Verification Failed");
//     console.error("--------------------------------------");
//     console.error("Name :", err.name);
//     console.error("Code :", err.code);
//     console.error("Msg  :", err.message);
//     console.error("======================================");
//   }
// })();

// module.exports = transporter;













const dns = require("dns");
const nodemailer = require("nodemailer");

// Force IPv4 first to prevent IPv6 routing issues on cloud providers like Railway
dns.setDefaultResultOrder("ipv4first");

// Configuration Variables
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
const EMAIL_SECURE =
  process.env.EMAIL_SECURE === "true" || EMAIL_PORT === 465;

// Log SMTP Configuration on startup
console.log("======================================");
console.log("📧 SMTP Configuration");
console.log("--------------------------------------");
console.log("Host      :", EMAIL_HOST);
console.log("Port      :", EMAIL_PORT);
console.log("Secure    :", EMAIL_SECURE);
console.log("User      :", EMAIL_USER ? "***" : "MISSING");
console.log("Env       :", process.env.NODE_ENV || "development");
console.log("======================================");

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  requireTLS: !EMAIL_SECURE,
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
    servername: EMAIL_HOST,
  },
  family: 4,
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
  logger: true,
  debug: false,
});

// Skip SMTP verification in production to prevent Railway deployment timeouts
if (process.env.NODE_ENV !== "production") {
  (async () => {
    try {
      await transporter.verify();
      console.log("======================================");
      console.log("✅ SMTP Ready (Development Check)");
      console.log("======================================");
    } catch (err) {
      console.error("======================================");
      console.error("❌ SMTP Verification Failed");
      console.error("--------------------------------------");
      console.error("Name :", err.name);
      console.error("Code :", err.code);
      console.error("Msg  :", err.message);
      console.error("======================================");
    }
  })();
} else {
  console.log("ℹ️ Production mode detected: Skipping SMTP verify on startup.");
}

module.exports = transporter;