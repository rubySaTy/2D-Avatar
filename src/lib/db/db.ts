import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Runtime check to ensure this file runs only on the server
if (typeof window !== "undefined") {
  console.error("db.ts is being imported on the client side!");
}

const pool = new Pool({ connectionString: process.env.DRIZZLE_DATABASE_URL! });
export const db = drizzle({ client: pool, schema });
