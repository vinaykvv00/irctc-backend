const nodemailer = require("nodemailer");
const { config } = require("../config");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST,
  port: Number(config.MAIL_PORT) || 587,
  secure: config.MAIL_SECURE === "true",
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS,
  },
});

const getMailErrorReason = (error) => {
  const code = (error && error.code ? String(error.code) : "").toUpperCase();
  const message = (error && error.message ? String(error.message) : "").toLowerCase();

  // Keep runtime logs specific enough to distinguish auth, network, and TLS failures.
  if (code === "EAUTH" || message.includes("authentication failed") || message.includes("invalid login")) {
    return "SMTP authentication failed";
  }

  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "ECONNREFUSED") {
    return "SMTP network or host connection failed";
  }

  if (message.includes("tls") || message.includes("certificate") || message.includes("ssl")) {
    return "SMTP TLS or certificate negotiation failed";
  }

  if (!config.MAIL_HOST || !config.MAIL_USER || !config.MAIL_PASS) {
    return "SMTP configuration is incomplete";
  }

  return "SMTP send failed";
};

const verifySmtpConnection = async () => {
  if (!config.MAIL_HOST || !config.MAIL_USER || !config.MAIL_PASS) {
    logger.warn("SMTP verification skipped because MAIL_HOST, MAIL_USER, or MAIL_PASS is missing");
    return false;
  }

  try {
    await transporter.verify();
    logger.info(`SMTP connection verified for ${config.MAIL_HOST}:${config.MAIL_PORT || 587}`);
    return true;
  } catch (error) {
    logger.error(`SMTP verification failed: ${getMailErrorReason(error)}. ${error.message}`);
    return false;
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: config.MAIL_FROM || config.MAIL_USER,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email: ${getMailErrorReason(error)}. ${error.message}`);
    throw error;
  }
};

const otpEmailTemplate = ({ firstName, otp, expiryMinutes }) => ({
  subject: "Your OTP for Signup",
  text: `Hello ${firstName}, your OTP is ${otp}. It will expire in ${expiryMinutes} minutes.`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="color: #0b57d0;">Verify your email</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Your OTP for signup is:</p>
      <div style="
        display: inline-block;
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 6px;
        padding: 12px 18px;
        background: #f4f7fb;
        border: 1px dashed #0b57d0;
        border-radius: 8px;
        margin: 10px 0;
      ">
        ${otp}
      </div>
      <p>This OTP will expire in <strong>${expiryMinutes} minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr />
      <small>IRCTC Backend Learning Project</small>
    </div>
  `,
});

module.exports = {
  sendEmail,
  otpEmailTemplate,
  verifySmtpConnection,
};