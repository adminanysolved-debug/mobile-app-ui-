import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 10,           // max 10 connections in pool (safe for free-tier DBs)
  idle_timeout: 20,  // close idle connections after 20s
  connect_timeout: 10, // fail fast if DB is unreachable (10s)
  max_lifetime: 1800,  // recycle connections every 30min to avoid stale ones
});
export const db = drizzle(client, { schema });