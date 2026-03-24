import nodemailer from "nodemailer";
import logger from "../config/logger";

interface EmailOptions {
  to: string;
  subject: string;
  otp: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'Gmail'
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const plainText = `Welcome to Mailify!

Your account has been created successfully.

One-time passcode (OTP): ${options.otp}

This code is valid for 10 minutes.

If you did not request this, please ignore this message.

— Mailify Team`;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f4f6f8; margin:0; padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="padding:24px 32px; text-align:center; background:linear-gradient(90deg,#4f46e5,#06b6d4); color:#ffffff;">
                      <h1 style="margin:0; font-size:20px; font-weight:600;">Mailify</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px; color:#0f172a;">
                      <p style="margin:0 0 16px; font-size:16px; line-height:1.5;">Welcome — your account was created successfully.</p>
                      <p style="margin:0 0 24px; font-size:16px; line-height:1.5;">Use the following one-time passcode (OTP) to complete verification:</p>

                      <div style="display:inline-block; padding:18px 24px; background:#f1f5f9; border-radius:8px; font-family: 'Courier New', Courier, monospace; font-size:24px; letter-spacing:2px; font-weight:700; color:#0f172a;">
                        ${options.otp}
                      </div>

                      <p style="margin:24px 0 0; font-size:13px; color:#6b7280;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 32px; background:#f8fafc; color:#6b7280; font-size:13px; text-align:center;">
                      © ${new Date().getFullYear()} Mailify — <span style="color:#475569">Helping you reach the right inbox</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: plainText,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
  } catch (error) {
    logger.error(
      `Error sending email to ${options.to}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
};
