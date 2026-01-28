import z from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_BASE_URL: z.url(),
  DATABSE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
