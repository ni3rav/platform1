import z from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_BASE_URL: z.url(),
  DATABASE_URL: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
