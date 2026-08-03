const nodemailer = require('nodemailer');

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const verifyConnection = async () => {
  const transporter = createTransporter();
  try {
    await transporter.verify();
    console.log('✅ SMTP connected successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    return false;
  }
};

const sendMail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  createTransporter,
  verifyConnection,
  sendMail,
};
