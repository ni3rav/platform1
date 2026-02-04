import { Resend } from "resend";
import { env } from "@/lib/env";
import EmailTemplate from "@/components/email/email-template";
import { render } from "@react-email/components";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string) {
  try {
    const emailHtml = await render(EmailTemplate({ 
      otp, 
      email 
    }));

    await resend.emails.send({
      from: 'noreply@emails.ni3rav.me',
      to: [email],
      subject: 'Verify Your Email - OTP Code',
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
}