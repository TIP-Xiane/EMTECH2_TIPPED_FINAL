import nodemailer from "nodemailer";

export function createMailer(config) {
  if (!config.emailConfigured) {
    return {
      async send() {
        throw new Error("Email delivery is not configured.");
      },
    };
  }
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return {
    async send({ to, subject, text, html }) {
      return transport.sendMail({
        from: config.EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
    },
  };
}
