const { createTransport } = require("nodemailer");

const createPasswordResetUrl = (id, token) =>
  `${process.env.CLIENT_URL}/reset-password/${id}/${token}`;

const transporter = createTransport({
  service: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
