const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to RQ Fashion',
    html: `
      <h1>Welcome to RQ Fashion, ${firstName}!</h1>
      <p>Thank you for joining our premium fashion community.</p>
      <p>Explore our exclusive collection of luxury fashion items.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

exports.sendOrderConfirmationEmail = async (email, orderNumber, items, totalAmount) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h1>Order Confirmed</h1>
      <p>Thank you for your order!</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
      <p>You will receive a shipping confirmation email soon.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

exports.sendPasswordResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

exports.sendShippingNotificationEmail = async (email, orderNumber, trackingNumber) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Your Order is Shipped - ${orderNumber}`,
    html: `
      <h1>Order Shipped!</h1>
      <p>Your order ${orderNumber} has been shipped.</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};
