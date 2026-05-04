import nodemailer from "nodemailer";

const host = process.env["EMAIL_HOST"];
const port = Number(process.env["EMAIL_PORT"] ?? 587);
const user = process.env["EMAIL_USER"];
const pass = process.env["EMAIL_PASS"];
const from = process.env["EMAIL_FROM"];

const transporter =
  host && user && pass
    ? nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass }
      })
    : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter || !from) {
    console.warn("Email not configured; skipping sendEmail");
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
}

