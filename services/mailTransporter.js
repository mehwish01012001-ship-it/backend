const nodemailer = require("nodemailer");
const dns = require("dns");

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
  family: 4,
  connectionTimeout: 10000,
  lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
});

module.exports = transporter;