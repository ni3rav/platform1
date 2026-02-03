"use server";
import crypto from "node:crypto";
import { redis } from "@/lib/redis";
import { REDIS_OTP_TTL, RATE_LIMIT_TTL, VALID_EMAIL_REGEX } from "@/lib/constants";
import { sendOtpEmail } from "@/lib/email";

export async function generateOtp(email: string) {
  try {
    if (!email || !VALID_EMAIL_REGEX.test(email)) {
      throw new Error("Please enter a valid institute email");
    }

    // Check rate limit
    const rateLimitKey = `rate_limit:${email}`;
    const isRateLimited = await redis.exists(rateLimitKey);
    
    if (isRateLimited) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new Error(`Wait ${Math.ceil(ttl / 60)} minutes before requesting another OTP`);
    }

    const otp = crypto.randomInt(1_000_000, 10_000_000).toString();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await redis.set(`otp:${email}`, JSON.stringify({ hash: hashedOtp }), {
      ex: REDIS_OTP_TTL,
    });

    // Set rate limit
    await redis.set(rateLimitKey, "1", { ex: RATE_LIMIT_TTL });
    
    await sendOtpEmail(email, otp);
    
    return { success: true };
  } catch (error) {
    console.error("OTP error:", error);
    throw error;
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
