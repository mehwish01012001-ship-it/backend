
const transporter = require("../services/mailTransporter");

const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD;
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER || process.env.SMTP_FROM;





const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatAddress = (address = {}) => {
  if (!address || Object.keys(address).length === 0) {
    return 'Not provided';
  }

  const lines = [
    address.addressLine1,
    address.addressLine2,
    `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}`,
    `${address.zipCode || ''}${address.zipCode && address.country ? ', ' : ''}${address.country || ''}`,
  ]
    .filter(Boolean)
    .join('<br />');

  return lines || 'Not provided';
};

const renderOrderItems = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <tr>
        <td colspan="6" style="padding: 16px; text-align: center; color: #6b7280;">No items available</td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const productName = item.productName || item.product?.name || item.product?.title || item.product || 'Product';
      const unitPrice = formatCurrency(item.price);
      const quantity = item.quantity || 0;
      const total = formatCurrency((item.price || 0) * quantity);
      const size = item.size || '—';
      const color = item.color || '—';

      return `
        <tr>
          <td style="padding: 14px; border: 1px solid #e5e7eb;">${productName}</td>
          <td style="padding: 14px; border: 1px solid #e5e7eb; text-align: center;">${size}</td>
          <td style="padding: 14px; border: 1px solid #e5e7eb; text-align: center;">${color}</td>
          <td style="padding: 14px; border: 1px solid #e5e7eb; text-align: center;">${quantity}</td>
          <td style="padding: 14px; border: 1px solid #e5e7eb; text-align: right;">${unitPrice}</td>
          <td style="padding: 14px; border: 1px solid #e5e7eb; text-align: right;">${total}</td>
        </tr>
      `;
    })
    .join('');
};

const buildOrderSummary = ({ subtotal, shippingCost, discount, taxAmount, totalAmount }) => {
  const formattedSubtotal = formatCurrency(subtotal ?? totalAmount ?? 0);
  const formattedShipping = formatCurrency(shippingCost ?? 0);
  const formattedDiscount = formatCurrency(discount ?? 0);
  const formattedTax = formatCurrency(taxAmount ?? 0);
  const formattedGrandTotal = formatCurrency(totalAmount ?? ((subtotal || 0) + (shippingCost || 0) - (discount || 0) + (taxAmount || 0)));

  return `
    <tr>
      <td style="padding: 12px 14px; color: #6b7280;">Subtotal</td>
      <td style="padding: 12px 14px; text-align: right;">${formattedSubtotal}</td>
    </tr>
    <tr>
      <td style="padding: 12px 14px; color: #6b7280;">Shipping Charges</td>
      <td style="padding: 12px 14px; text-align: right;">${formattedShipping}</td>
    </tr>
    <tr>
      <td style="padding: 12px 14px; color: #6b7280;">Discount</td>
      <td style="padding: 12px 14px; text-align: right;">${formattedDiscount}</td>
    </tr>
    <tr>
      <td style="padding: 12px 14px; color: #6b7280;">Tax</td>
      <td style="padding: 12px 14px; text-align: right;">${formattedTax}</td>
    </tr>
    <tr>
      <td style="padding: 16px 14px 12px; font-weight: 700; color: #111827;">Grand Total</td>
      <td style="padding: 16px 14px 12px; text-align: right; font-weight: 700; color: #111827;">${formattedGrandTotal}</td>
    </tr>
  `;
};

const createEmailHtml = (order) => {
  const customerName = order.customerInfo?.name || order.shippingAddress?.fullName || 'Customer';
  const customerEmail = order.customerInfo?.email || order.user?.email || 'Not provided';
  const customerPhone = order.customerInfo?.phone || order.shippingAddress?.phone || 'Not provided';
  const shippingAddress = formatAddress(order.shippingAddress);
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not provided';
  const paymentMethod = order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'Not provided';
  const paymentStatus = order.paymentStatus || 'Not provided';
  const orderStatus = order.orderStatus || 'Not provided';
  const orderNumber = order.orderNumber || 'N/A';

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Order Received</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .container { width: 100%; max-width: 650px; margin: 0 auto; }
        .card { background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 70px rgba(15, 23, 42, 0.08); overflow: hidden; }
        .header { background-color: #16a34a; color: #ffffff; padding: 32px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.02em; }
        .header p { margin: 8px 0 0; color: rgba(255, 255, 255, 0.88); }
        .section { padding: 28px 30px; }
        .section-title { margin: 0 0 16px; font-size: 18px; color: #111827; }
        .detail-grid { width: 100%; border-collapse: collapse; }
        .detail-grid td { padding: 10px 0; vertical-align: top; }
        .detail-grid .label { color: #6b7280; width: 140px; }
        .detail-grid .value { color: #111827; }
        .panel { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; }
        .table-wrapper { width: 100%; overflow-x: auto; }
        .order-table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        .order-table th, .order-table td { border: 1px solid #e5e7eb; padding: 14px; text-align: left; }
        .order-table th { background: #f3f4f6; color: #111827; font-weight: 700; }
        .summary-table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        .summary-table td { border: none; padding: 10px 0; }
        .summary-table .label { color: #6b7280; }
        .summary-table .value { color: #111827; font-weight: 600; text-align: right; }
        .footer { padding: 24px 30px 32px; text-align: center; color: #6b7280; font-size: 13px; }
        .button { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-size: 14px; margin-top: 12px; }
        @media only screen and (max-width: 620px) {
          .header, .section, .footer { padding-left: 20px; padding-right: 20px; }
          .detail-grid .label { display: block; width: 100%; padding-bottom: 4px; }
          .order-table th, .order-table td { padding: 12px 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td>
              <div class="card">
                <div class="header">
                  <p style="margin: 0; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; opacity: 0.78;">RQ Fashion</p>
                  <h1>New Order Received</h1>
                  <p>Your store has received a new order and is ready for processing.</p>
                </div>

                <div class="section">
                  <h2 class="section-title">Customer Information</h2>
                  <table class="detail-grid">
                    <tr>
                      <td class="label">Name</td>
                      <td class="value">${customerName}</td>
                    </tr>
                    <tr>
                      <td class="label">Phone</td>
                      <td class="value">${customerPhone}</td>
                    </tr>
                    <tr>
                      <td class="label">Email</td>
                      <td class="value">${customerEmail}</td>
                    </tr>
                    <tr>
                      <td class="label">Shipping Address</td>
                      <td class="value">${shippingAddress}</td>
                    </tr>
                  </table>
                </div>

                <div class="section" style="background: #ffffff; border-top: 1px solid #e5e7eb;">
                  <h2 class="section-title">Order Information</h2>
                  <table class="detail-grid">
                    <tr>
                      <td class="label">Order ID</td>
                      <td class="value">${orderNumber}</td>
                    </tr>
                    <tr>
                      <td class="label">Order Date</td>
                      <td class="value">${orderDate}</td>
                    </tr>
                    <tr>
                      <td class="label">Payment Method</td>
                      <td class="value">${paymentMethod}</td>
                    </tr>
                    <tr>
                      <td class="label">Payment Status</td>
                      <td class="value">${paymentStatus}</td>
                    </tr>
                    <tr>
                      <td class="label">Order Status</td>
                      <td class="value">${orderStatus}</td>
                    </tr>
                  </table>
                </div>

                <div class="section panel">
                  <h2 class="section-title">Products</h2>
                  <div class="table-wrapper">
                    <table class="order-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Size</th>
                          <th>Color</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${renderOrderItems(order.items)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="section panel" style="margin-top: 12px;">
                  <h2 class="section-title">Order Summary</h2>
                  <table class="summary-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    ${buildOrderSummary(order)}
                  </table>
                </div>

                <div class="section" style="text-align: center;">
                  <a class="button" href="#">View Order</a>
                </div>

                <div class="footer">
                  <p>Thank you for using RQ Fashion.</p>
                  <p>Automatically generated order notification. Do not reply to this email.</p>
                  <p style="margin-top: 8px;">© ${new Date().getFullYear()} RQ Fashion. All rights reserved.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `;
};

const sendOrderEmail = async (order) => {
  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.error('❌ Order email configuration is incomplete:');
    console.error('   EMAIL_USER:', EMAIL_USER ? '✓' : '✗ MISSING');
    console.error('   EMAIL_PASS:', EMAIL_PASS ? '✓' : '✗ MISSING');
    console.error('   EMAIL_TO:', EMAIL_TO ? `✓ ${EMAIL_TO}` : '✗ MISSING');
    return;
  }

  console.log(`📨 Preparing admin notification email for ${EMAIL_TO}...`);
  
  const plainOrder = order && typeof order.toObject === 'function' ? order.toObject() : order;
 
  const itemsWithNames = (plainOrder.items || []).map((item) => ({
  ...item,
  productName:
    item.productName ||
    item.product?.name ||
    item.product?.title ||
    item.product ||
    'Product',
}));

  const orderWithProducts = {
    ...plainOrder,
    items: itemsWithNames,
  };

  const html = createEmailHtml(orderWithProducts);
  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: '🛒 New Order Received - ' + order.orderNumber,
    html,
  };

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Order notification email sent to ${EMAIL_TO} (Attempt ${attempt}/5)`);
      console.log('   Message ID:', info.messageId);
      return;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === 5;
      console.error(
        `❌ Order email attempt ${attempt}/5 failed (${error.code || error.name}):`,
        error.message
      );
      if (!isLastAttempt) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 15000);
        console.log(`⏳ Retrying order email in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`❌ Order email failed after 5 attempts to ${EMAIL_TO}:`);
  console.error('   Error:', lastError.message);
  console.error('   Code:', lastError.code || 'N/A');
};

module.exports = sendOrderEmail;
