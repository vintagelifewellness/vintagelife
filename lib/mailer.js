// lib/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ""),
  },
});

export async function sendOtpMail(otp) {
  const to = process.env.EMAIL_USER;
  await transporter.sendMail({
    from: `"Stock Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Stock Edit OTP: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827; margin-top: 0;">Stock Edit Verification</h2>
        <p style="color: #374151;">Use the OTP below to unlock stock editing.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Valid for 5 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}