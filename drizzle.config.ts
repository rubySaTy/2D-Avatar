import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/utils/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
