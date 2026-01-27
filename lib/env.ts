import z from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_BASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
