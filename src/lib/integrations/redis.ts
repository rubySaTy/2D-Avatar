import { Redis } from "@upstash/redis";

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN)
  throw new Error("Missing Redis configuration in environment variables.");

export const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});
