const nodemailer = require("nodemailer");
const dns = require("dns");

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
  // Force IPv4 only (avoid IPv6 connectivity issues)
  family: 4,
  lookup: (hostname, options, callback) => {
    // Use callback-based dns.lookup with explicit family: 4
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      if (err) {
        console.error(`⚠️  DNS IPv4 lookup failed for ${hostname}:`, err.code);
        // Try IPv6 as fallback (some environments may only have IPv6)
        dns.lookup(hostname, { family: 6 }, (err6, address6, family6) => {
          if (err6) {
            console.error(`⚠️  DNS IPv6 fallback also failed:`, err6.code);
            return callback(err);
          }
          console.warn(`⚠️  Using IPv6 fallback for ${hostname}: ${address6}`);
          callback(null, address6, family6);
        });
        return;
      }
      console.log(`✅ IPv4 DNS resolved: ${hostname} -> ${address}`);
      callback(null, address, family);
    });
  },
});

// Verify transporter connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Email transporter verification failed:', err.message);
  } else {
    console.log('✅ Email transporter verified and ready');
  }
});

module.exports = transporter;