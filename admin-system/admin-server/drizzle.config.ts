import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "../../server/src/shared/schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/realdream",
    },
});
