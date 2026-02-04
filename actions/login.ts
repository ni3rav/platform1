"use server";
import crypto from "node:crypto";
import { redis } from "@/lib/redis";
import {
  REDIS_OTP_TTL,
  RATE_LIMIT_TTL,
  VALID_EMAIL_REGEX,
  ADMIN_EMAILS,
} from "@/lib/constants";
import { sendOtpEmail } from "@/lib/email";
import { signToken, User } from "@/lib/jwt";
import { cookies } from "next/headers";
import { IS_PRODUCTION } from "@/lib/env";

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
      throw new Error(
        `Wait ${Math.ceil(ttl / 60)} minutes before requesting another OTP`,
      );
    }

    const otp = crypto.randomInt(100_000, 1_000_000).toString();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    console.log("Storing hashed OTP for email:", email);

    await redis.set(`otp:${email}`, hashedOtp, {
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
    const storedHash = await redis.get(`otp:${email}`);
    if (!storedHash) {
      throw new Error("OTP not found or expired");
    }
    
    console.log("Stored hash found for email:", email);
    
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (storedHash !== otpHash) {
      throw new Error("Invalid OTP");
    }
    
    // jwt generation
    const user: User = {
      email,
      role: ADMIN_EMAILS.includes(email) ? "admin" : "user",
    };
    const token = signToken(user);

    // Set secure httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    await redis.del(`otp:${email}`);

    return { success: true };
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
}
