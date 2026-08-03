const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

exports.welcomeEmailTemplate = (firstName = "there") => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to RQ Fashion</h2>
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Thank you for joining our premium fashion community.</p>
    <p>Explore our latest collection and enjoy your shopping experience.</p>
  </div>
`;

exports.orderConfirmationTemplate = (orderNumber, totalAmount = 0) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Order Confirmed</h2>
    <p>Thank you for your order.</p>
    <p><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
    <p><strong>Total Amount:</strong> Rs. ${Number(totalAmount || 0).toFixed(2)}</p>
    <p>You will receive shipping updates soon.</p>
  </div>
`;

exports.passwordResetTemplate = (resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Reset Your Password</h2>
    <p>Click the button below to reset your password.</p>
    <p>
      <a href="${escapeHtml(resetLink)}" style="display: inline-block; padding: 10px 16px; background: #111827; color: #fff; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
    </p>
    <p>This link expires in 1 hour.</p>
  </div>
`;

exports.shippingNotificationTemplate = (orderNumber, trackingNumber) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Your Order Has Shipped</h2>
    <p>Your order <strong>${escapeHtml(orderNumber)}</strong> has been shipped.</p>
    <p><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>
  </div>
`;
