const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  host: process.env.EMAIL_HOST || "smtp.gmail.com",

  port: Number(process.env.EMAIL_PORT) || 587,

  secure: process.env.EMAIL_SECURE === "true",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
  }

});


transporter.verify((error) => {

  if (error) {

    console.log(
      "SMTP ERROR:",
      error.message
    );

  } else {

    console.log(
      "SMTP SERVER READY"
    );

  }

});


module.exports = transporter;