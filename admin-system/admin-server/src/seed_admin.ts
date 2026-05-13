import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_N0uhjCFLr5QX@ep-divine-cloud-a1x28cpe-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        const email = 'admin@realdream.app';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log(`Checking for admin: ${email}`);
        
        const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
        
        if (result.rows.length > 0) {
            console.log('Admin already exists in admin_users. Updating password...');
            await pool.query('UPDATE admin_users SET password_hash = $1, is_active = true WHERE email = $2', [hashedPassword, email]);
            console.log('Admin password updated.');
        } else {
            console.log('Creating new admin in admin_users...');
            await pool.query(
                'INSERT INTO admin_users (email, password_hash, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5)',
                [email, hashedPassword, 'RealDream Admin', 'admin', true]
            );
            console.log('Admin user created successfully.');
        }
    } catch (err) {
        console.error('Seed error:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();
