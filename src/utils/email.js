const { createTransport } = require("nodemailer");

const createPasswordResetUrl = (id, token) =>
  `${process.env.CLIENT_URL}/reset-password/${id}/${token}`;

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendPasswordResetEmail = (email, resetUrl) =>
  transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Redefinição de senha - RotaSegura",
    text: `Acesse o link para redefinir sua senha: ${resetUrl}\n\nO link expira em 1 hora. Se você não solicitou esta redefinição, ignore este e-mail.`,
    html: `<p>Acesse o link abaixo para redefinir sua senha:</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>O link expira em 1 hora. Se você não solicitou esta redefinição, ignore este e-mail.</p>`,
  });

module.exports = {
  createPasswordResetUrl,
  sendPasswordResetEmail,
};
