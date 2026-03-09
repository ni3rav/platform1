import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildOtpEmailHtml(email: string, otp: string): string {
  const safeEmail = escapeHtml(email);
  const safeOtp = escapeHtml(otp);

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#2a2a2a;color:#fafafa;">
      <div style="background-color:#353535;padding:30px;border-radius:8px;text-align:center;border:1px solid rgba(255,255,255,0.1);">
        <h1 style="color:#fafafa;margin-bottom:20px;font-size:24px;font-weight:bold;">Welcome!</h1>
        <p style="color:#999999;font-size:16px;line-height:1.5;margin-bottom:20px;">
          Welcome to Platform1. Thanks for your interest. Your verification code is:
        </p>
        <div style="display:inline-block;background-color:#7c3aed;color:#f3e8ff;padding:16px 24px;border-radius:8px;font-weight:bold;font-size:24px;letter-spacing:4px;margin-bottom:20px;font-family:monospace;">
          ${safeOtp}
        </div>
        <p style="color:#999999;font-size:14px;margin-top:20px;">Enter this code on the verification page to complete your login.</p>
        <p style="color:#666666;font-size:14px;margin-top:20px;">If you did not request this, you can safely ignore this email.</p>
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;color:#666666;">
          <p>This email was sent to: ${safeEmail}</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendOtpEmail(email: string, otp: string) {
  try {
    await resend.emails.send({
      from: 'noreply@emails.ni3rav.me',
      to: [email],
      subject: 'Verify Your Email - OTP Code',
      html: buildOtpEmailHtml(email, otp),
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
}