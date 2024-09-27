import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

config({ path: ".env.local" }); // or .env.local

const sql = neon(process.env.DRIZZLE_DATABASE_URL!);

export const db = drizzle(sql);
