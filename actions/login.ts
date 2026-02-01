"use server";
import crypto from "node:crypto";
import { redis } from "@/lib/redis";
import { REDIS_OTP_TTL, VALID_EMAIL_REGEX } from "@/lib/constants";

export async function generateOtp(email: string) {
  try {
    if (!email || !VALID_EMAIL_REGEX.test(email)) {
      throw new Error("Please enter a valid institute email");
    }
    const otp = crypto.randomInt(1_000_000, 10_000_000).toString();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await redis.set(`otp:${email}`, JSON.stringify({ hash: hashedOtp }), {
      ex: REDIS_OTP_TTL,
    });

    // for now return otp as is, later integrate resend to send it via email
    return { success: true, otp };
  } catch (error) {
    console.error("OTP error:", error);
    throw new Error("Failed to generate OTP");
  }
}

export async function verifyOtp(email: string, otp: string) {
  try {
    const storedData = await redis.get(`otp:${email}`);
    if (!storedData) {
      throw new Error("OTP not found or expired");
    }

    const { hash } = JSON.parse(storedData as string);

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hash !== hashedOtp) {
      throw new Error("Invalid OTP");
    }
    // todo: token generation will come here
    await redis.del(`otp:${email}`);

    return { success: true };
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
}
