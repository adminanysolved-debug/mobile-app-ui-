const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log("Checking tables...");
        const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        const tableExist = tables.rows.some(t => t.tablename === 'admin_users');

        if (!tableExist) {
            console.log("Creating admin_users table...");
            await pool.query(`
                CREATE TABLE admin_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    full_name TEXT,
                    role TEXT DEFAULT 'admin',
                    is_active BOOLEAN DEFAULT true,
                    last_login_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
        }

        const adminExists = await pool.query("SELECT * FROM admin_users WHERE email = 'admin@realdream.com'");
        if (adminExists.rows.length === 0) {
            console.log("Creating default admin user...");
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO admin_users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)",
                ['admin@realdream.com', hash, 'Lead Administrator', 'superadmin']
            );
            console.log("Default admin created: admin@realdream.com / admin123");
        } else {
            console.log("Admin account already exists.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

setup();
