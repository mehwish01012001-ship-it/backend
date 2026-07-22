const nodemailer = require('nodemailer');

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = Number(process.env.EMAIL_PORT) || 587;
const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || emailUser || 'no-reply@rqfashion.com';

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
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

const createMailOptions = (to, subject, html) => ({
  from: emailFrom,
  to,
  subject,
  html,
});

exports.sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = createMailOptions(
    email,
    'Welcome to RQ Fashion',
    `
      <h1>Welcome to RQ Fashion, ${firstName}!</h1>
      <p>Thank you for joining our premium fashion community.</p>
      <p>Explore our exclusive collection of luxury fashion items.</p>
    `
  );

  try {
    await transporter.sendMail(mailOptions);
  }catch (error) {
 console.error('Email send error:', error);
 throw error;
}
};

exports.sendOrderConfirmationEmail = async (email, orderNumber, items, totalAmount) => {
  const mailOptions = createMailOptions(
    email,
    `Order Confirmation - ${orderNumber}`,
    `
      <h1>Order Confirmed</h1>
      <p>Thank you for your order!</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
      <p>You will receive a shipping confirmation email soon.</p>
    `
  );

  try {
    await transporter.sendMail(mailOptions);
  }catch (error) {
 console.error('Email send error:', error);
 throw error;
}
};

exports.sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = createMailOptions(
    email,
    'Password Reset Request',
    `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `
  ); // <-- Fixed typo here (replaced '}' with ')')

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

exports.sendShippingNotificationEmail = async (email, orderNumber, trackingNumber) => {
  const mailOptions = createMailOptions(
    email,
    `Your Order is Shipped - ${orderNumber}`,
    `
      <h1>Order Shipped!</h1>
      <p>Your order ${orderNumber} has been shipped.</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
    `
  );

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};