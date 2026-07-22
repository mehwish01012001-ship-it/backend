const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const emailPort = Number(process.env.EMAIL_PORT) || 465;
const emailSecure = process.env.EMAIL_SECURE === "true" || emailPort === 465;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

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
    dns.lookup(hostname, { family: 4, all: false })
      .then((result) => {
        callback(null, result.address, result.family);
      })
      .catch((err) => {
        callback(err);
      });
  },
});

module.exports = transporter;