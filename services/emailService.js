const transporter = require("./mailTransporter");

const emailFrom =
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "no-reply@rqfashion.com";


const createMailOptions = (to, subject, html) => ({
  from: emailFrom,
  to,
  subject,
  html,
});


// Welcome Email
exports.sendWelcomeEmail = async (email, firstName) => {

  const mailOptions = createMailOptions(
    email,
    "Welcome to RQ Fashion",
    `
      <h1>Welcome to RQ Fashion, ${firstName}!</h1>
      <p>Thank you for joining our premium fashion community.</p>
      <p>Explore our exclusive collection.</p>
    `
  );


  try {

    await transporter.sendMail(mailOptions);

  } catch(error){

    console.error("Welcome email error:", error.message);
    throw error;

  }

};



// Order Confirmation Email
exports.sendOrderConfirmationEmail = async (
  email,
  orderNumber,
  items,
  totalAmount
) => {


  const mailOptions = createMailOptions(

    email,

    `Order Confirmation - ${orderNumber}`,

    `
      <h1>Order Confirmed ✅</h1>

      <p>Thank you for your order!</p>

      <p>
      <strong>Order Number:</strong>
      ${orderNumber}
      </p>

      <p>
      <strong>Total Amount:</strong>
      Rs. ${Number(totalAmount || 0).toFixed(2)}
      </p>

      <p>
      You will receive shipping updates soon.
      </p>
    `

  );


  try {

    await transporter.sendMail(mailOptions);


  } catch(error){

    console.error(
      "Order confirmation email error:",
      error.message
    );

    throw error;

  }

};



// Password Reset Email
exports.sendPasswordResetEmail = async (
  email,
  resetLink
) => {


  const mailOptions = createMailOptions(

    email,

    "Password Reset Request",

    `
      <h1>Reset Your Password</h1>

      <p>
      Click the link below:
      </p>

      <a href="${resetLink}">
      Reset Password
      </a>

      <p>
      This link expires in 1 hour.
      </p>
    `

  );


  try {

    await transporter.sendMail(mailOptions);

  } catch(error){

    console.error(
      "Password reset email error:",
      error.message
    );

  }

};



// Shipping Notification
exports.sendShippingNotificationEmail = async (
  email,
  orderNumber,
  trackingNumber
) => {


  const mailOptions = createMailOptions(

    email,

    `Your Order is Shipped - ${orderNumber}`,

    `
      <h1>Order Shipped 🚚</h1>

      <p>
      Your order ${orderNumber} has been shipped.
      </p>

      <p>
      Tracking Number:
      ${trackingNumber}
      </p>
    `

  );


  try {

    await transporter.sendMail(mailOptions);

  } catch(error){

    console.error(
      "Shipping email error:",
      error.message
    );

  }

};