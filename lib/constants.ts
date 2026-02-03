const ACCEPTED_BRANCHES = ["cse", "ict", "cie"] as const;

export const VALID_EMAIL_REGEX = new RegExp(
  `^[a-zA-Z]+\\.(${ACCEPTED_BRANCHES.join("|")})\\d{2}@adaniuni\\.ac\\.in$`,
);
export const REDIS_OTP_TTL = 300;
export const RATE_LIMIT_TTL = 300; // 5 minutes