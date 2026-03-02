import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../../server/src/shared/schema';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/realdream",
    ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
