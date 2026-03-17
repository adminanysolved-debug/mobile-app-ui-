import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import os from 'os';
import { pool } from './db';

const app = express();
const port = process.env.PORT || 5001;
const JWT_SECRET = process.env.SESSION_SECRET || 'super_secret_admin_key_123';

// SMTP Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Middleware to protect admin routes
const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Admin Server is healthy', timestamp: new Date().toISOString() });
});

app.post('/api/admin/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM admin_users WHERE email = $1 AND is_active = true', [email]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [admin.id]);

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                fullName: admin.full_name,
                role: admin.role
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Apply protection to all management routes
app.use('/api/admin', (req, res, next) => {
    if (req.path === '/login') return next();
    authenticateAdmin(req, res, next);
});

// Also protect the main data routes used by the dashboard
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const usersRes = await pool.query(`SELECT count(*)::int as count FROM users`);
        const dreamsRes = await pool.query(`SELECT count(*)::int as count FROM dreams WHERE is_completed = false`);
        const tasksRes = await pool.query(`SELECT count(*)::int as count FROM dream_tasks WHERE is_completed = true`);
        const coinsRes = await pool.query(`SELECT sum(amount)::int as count FROM transactions WHERE amount > 0 AND type = 'spin'`);

        res.json({
            totalUsers: usersRes.rows[0].count || 0,
            activeDreams: dreamsRes.rows[0].count || 0,
            completedTasks: tasksRes.rows[0].count || 0,
            totalCoinsAwarded: coinsRes.rows[0].count || 0
        });
    } catch (error: any) {
        console.error("Failed to fetch stats", error);
        res.status(500).json({ error: error?.message || "Failed to fetch stats", details: String(error) });
    }
});

// Real-Time System Health Endpoint
app.get('/api/admin/system-health', authenticateAdmin, async (req, res) => {
    try {
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        const dbLatency = Date.now() - dbStart;

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        res.json({
            status: 'operational',
            database: {
                status: 'connected',
                latency: `${dbLatency}ms`
            },
            server: {
                uptime: `${Math.floor(process.uptime())}s`,
                memory: {
                    total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    percentage: `${((usedMem / totalMem) * 100).toFixed(1)}%`
                },
                load: os.loadavg()[0].toFixed(2)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Health check failed", error);
        res.status(500).json({ status: 'degraded', error: 'Database connection failed' });
    }
});

// Password Management using SMTP
app.post('/api/admin/forgot-password', async (req: any, res: any) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT id, full_name FROM admin_users WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        const resetToken = jwt.sign({ id: admin.id, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"RealDream Admin" <noreply@realdream.com>',
            to: email,
            subject: 'RealDream Admin: Password Reset Request',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #0a0f1e; color: #fff; border-radius: 20px; text-align: center; border: 1px solid rgba(99, 102, 241, 0.2);">
                    <h1 style="color: #6366f1; margin-bottom: 30px; font-weight: 800; letter-spacing: -1px;">RealDream Admin</h1>
                    <p style="font-size: 16px; color: #94a3b8; margin-bottom: 40px;">Hello ${admin.full_name},<br>Secure access protocol initiated. Use the button below to synchronize your new credentials.</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);">SYNCHRONIZE KEY</a>
                    <p style="font-size: 12px; color: #475569; margin-top: 40px;">This link will expire in 1 hour. If you did not request this, please ignore.</p>
                </div>
            `
        });

        res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error("Forgot password error", error);
        res.status(500).json({ error: 'Failed to process password reset' });
    }
});

app.post('/api/admin/change-password', authenticateAdmin, async (req: any, res: any) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    try {
        const result = await pool.query('SELECT password_hash FROM admin_users WHERE id = $1', [adminId]);
        const admin = result.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, adminId]);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error("Change password error", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users', authenticateAdmin, async (req, res) => {
    try {
        const usersRes = await pool.query(`
            SELECT id, email, username, full_name, auth_provider, is_vendor, vendor_business_name, vendor_tier, subscription_tier, profile_photo, profile_image, coins, age, gender, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(usersRes.rows);
    } catch (error: any) {
        console.error("Failed to fetch users", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get('/api/dreams', authenticateAdmin, async (req, res) => {
    try {
        const dreamsRes = await pool.query(`
            SELECT d.id, d.title, d.type, d.privacy, d.progress, d.is_completed, d.created_at, u.username, u.full_name
            FROM dreams d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `);
        res.json(dreamsRes.rows);
    } catch (error: any) {
        console.error("Failed to fetch dreams", error);
        res.status(500).json({ error: "Failed to fetch dreams" });
    }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // The Drizzle schema has ON DELETE CASCADE on most tables, 
        // but we manually clean up to be absolutely sure and avoid foreign key violations.
        
        // 1. Clean up post-level dependencies
        await pool.query('DELETE FROM post_likes WHERE post_id IN (SELECT id FROM news_feed_posts WHERE user_id = $1)', [id]);
        await pool.query('DELETE FROM post_comments WHERE post_id IN (SELECT id FROM news_feed_posts WHERE user_id = $1)', [id]);
        
        // 2. Clean up user-level activity
        await pool.query('DELETE FROM post_comments WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM post_likes WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM news_feed_posts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM gallery_posts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM market_purchases WHERE user_id = $1 OR vendor_id = $1', [id]);
        await pool.query('DELETE FROM market_items WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM champions WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);
        await pool.query('DELETE FROM conversations WHERE participant1_id = $1 OR participant2_id = $1', [id]);
        await pool.query('DELETE FROM connections WHERE follower_id = $1 OR following_id = $1', [id]);
        await pool.query('DELETE FROM dream_members WHERE user_id = $1', [id]);
        
        // 3. Clean up dreams and tasks
        await pool.query('DELETE FROM dream_tasks WHERE dream_id IN (SELECT id FROM dreams WHERE user_id = $1)', [id]);
        await pool.query('DELETE FROM dreams WHERE user_id = $1', [id]);
        
        // 4. Finally delete the user
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'Identity decommissioned successfully' });
    } catch (error: any) {
        console.error("Failed to delete user", error);
        res.status(500).json({ error: "Decommissioning failed: " + (error?.message || "Internal error") });
    }
});

app.delete('/api/admin/dreams/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM dream_tasks WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM dream_members WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM news_feed_posts WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM dreams WHERE id = $1', [id]);
        res.json({ success: true, message: 'Dream data wiped' });
    } catch (error: any) {
        console.error("Failed to delete dream", error);
        res.status(500).json({ error: "Wipe failed" });
    }
});

// Post & Comment Moderation Endpoints
app.delete('/api/admin/posts/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM post_likes WHERE post_id = $1', [id]);
        await pool.query('DELETE FROM post_comments WHERE post_id = $1', [id]);
        await pool.query('DELETE FROM news_feed_posts WHERE id = $1', [id]);
        res.json({ success: true, message: 'Broadcast transmission terminated' });
    } catch (error: any) {
        console.error("Failed to delete post", error);
        res.status(500).json({ error: "Termination failed" });
    }
});

app.delete('/api/admin/comments/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM post_comments WHERE id = $1', [id]);
        res.json({ success: true, message: 'Comment redacted' });
    } catch (error: any) {
        console.error("Failed to delete comment", error);
        res.status(500).json({ error: "Redaction failed" });
    }
});

app.get('/api/admin/posts/:id/comments', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT c.id, c.content, c.created_at, u.username
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (error: any) {
        console.error("Failed to fetch comments", error);
        res.status(500).json({ error: "Sync failed" });
    }
});

app.get('/api/newsfeed', authenticateAdmin, async (req, res) => {
    try {
        const feedRes = await pool.query(`
            SELECT p.id, p.content, p.likes, p.comments, p.created_at, u.username, d.title as dream_title
            FROM news_feed_posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN dreams d ON p.dream_id = d.id
            ORDER BY p.created_at DESC
        `);
        res.json(feedRes.rows);
    } catch (error: any) {
        console.error("Failed to fetch news feed", error);
        res.status(500).json({ error: "Failed to fetch news feed" });
    }
});

app.get('/api/market-items', authenticateAdmin, async (req, res) => {
    try {
        const itemsRes = await pool.query(`
            SELECT m.id, m.title, m.category, m.price, m.is_premium, m.is_active, m.created_at, m.how_to_achieve, u.username as vendor_name, u.vendor_tier
            FROM market_items m
            LEFT JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
        `);
        res.json(itemsRes.rows);
    } catch (error: any) {
        console.error("Failed to fetch market items", error);
        res.status(500).json({ error: "Failed to fetch market items" });
    }
});

app.post('/api/admin/users/:id/coins', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;

        await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [amount, id]);
        
        await pool.query(`
            INSERT INTO transactions (user_id, amount, type, description)
            VALUES ($1, $2, 'admin_adjustment', $3)
        `, [id, amount, description || 'Admin adjustment']);

        res.json({ success: true, message: `Successfully adjusted coins by ${amount}` });
    } catch (error: any) {
        console.error("Failed to adjust coins", error);
        res.status(500).json({ error: "Failed to adjust coins" });
    }
});

app.delete('/api/admin/market-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM market_purchases WHERE item_id = $1', [id]);
        await pool.query('DELETE FROM market_items WHERE id = $1', [id]);
        res.json({ success: true, message: 'Market item deleted successfully' });
    } catch (error: any) {
        console.error("Failed to delete market item", error);
        res.status(500).json({ error: "Failed to delete market item" });
    }
});

app.put('/api/admin/users/:id/vendor', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_vendor, vendor_tier } = req.body;
        await pool.query('UPDATE users SET is_vendor = $1, vendor_tier = $2 WHERE id = $3', [is_vendor, vendor_tier, id]);
        res.json({ success: true, message: 'Vendor status updated successfully' });
    } catch (error: any) {
        console.error("Failed to update vendor status", error);
        res.status(500).json({ error: "Failed to update vendor status" });
    }
});

app.put('/api/admin/users/:id/subscription', async (req, res) => {
    try {
        const { id } = req.params;
        const { subscription_tier } = req.body;
        await pool.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [subscription_tier, id]);
        res.json({ success: true, message: 'Subscription tier updated successfully' });
    } catch (error: any) {
        console.error("Failed to update subscription tier", error);
        res.status(500).json({ error: "Failed to update subscription tier" });
    }
});

app.listen(port, () => {
    console.log(`Admin Server running on port ${port}`);
});
