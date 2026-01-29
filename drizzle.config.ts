import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found. Check .env file.");
}


export default defineConfig({
  out: "./migrations",
  schema: "./server/src/shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
