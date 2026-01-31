const ACCEPTED_BRANCHES = ["cse", "ict", "cie"] as const;

export const VALID_EMAIL_REGEX = new RegExp(
  `^[a-zA-Z]+\\.(${ACCEPTED_BRANCHES.join("|")})\\d{2}@adaniuni\\.ac\\.in$`,
);
