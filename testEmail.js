require("dotenv").config();

const transporter = require("./services/mailTransporter");

(async () => {
  try {
    console.log("📨 Sending test email...");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "muhammadarslanm011@gmail.com",
      subject: "Brevo SMTP Test",
      html: "<h2>SMTP Working ✅</h2>",
    });

    console.log("✅ Success");
    console.log(info);
  } catch (err) {
    console.error("❌ Error");
    console.error(err);
  }
})();
