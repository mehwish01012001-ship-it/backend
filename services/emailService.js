const { sendMail } = require('./smtpService');
const {
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  passwordResetTemplate,
  shippingNotificationTemplate,
} = require('./emailTemplates');

const sendWelcomeEmail = async (email, firstName) => {
  const html = welcomeEmailTemplate(firstName);
  return sendMail({
    to: email,
    subject: 'Welcome to RQ Fashion',
    html,
  });
};

const sendOrderConfirmationEmail = async (email, orderNumber, items, totalAmount) => {
  const html = orderConfirmationTemplate(orderNumber, totalAmount);
  return sendMail({
    to: email,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
  });
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const html = passwordResetTemplate(resetLink);
  return sendMail({
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};

const sendShippingNotificationEmail = async (email, orderNumber, trackingNumber) => {
  const html = shippingNotificationTemplate(orderNumber, trackingNumber);
  return sendMail({
    to: email,
    subject: `Your Order is Shipped - ${orderNumber}`,
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendShippingNotificationEmail,
};