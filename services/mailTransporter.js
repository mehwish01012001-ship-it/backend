const nodemailer = require("nodemailer");

const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const emailPort = Number(process.env.EMAIL_PORT) || 465;
const emailSecure = process.env.EMAIL_SECURE === "true" || emailPort === 465;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

console.log(`📧 Email Config: host=${emailHost}, port=${emailPort}, secure=${emailSecure}, user=${emailUser ? '***' : 'MISSING'}`);

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  connectionTimeout: 20000,
  socketTimeout: 20000,
  greetingTimeout: 10000,
  pool: {
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 2000,
    rateLimit: 7,
  },
  // Force IPv4 only via direct DNS configuration
  family: 4,
});

// Verify transporter connection on startup (non-blocking)
setImmediate(() => {
  transporter.verify((err, success) => {
    if (err) {
      console.error('⚠️  Email transporter verification failed:', err.message);
      console.error('   Emails may not work, but server will continue running.');
    } else {
      console.log('✅ Email transporter verified and ready');
    }
  }).catch((error) => {
    console.error('⚠️  Email transporter verify error:', error.message);
  });
});

module.exports = transporter;