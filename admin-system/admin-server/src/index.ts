import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Admin Server is healthy', timestamp: new Date().toISOString() });
});

app.get('/api/stats', async (req, res) => {
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

app.get('/api/users', async (req, res) => {
    try {
        const usersRes = await pool.query(`
            SELECT id, email, username, full_name, auth_provider, is_vendor, vendor_business_name, vendor_tier, subscription_tier, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(usersRes.rows);
    } catch (error: any) {
        console.error("Failed to fetch users", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get('/api/dreams', async (req, res) => {
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

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM market_purchases WHERE user_id = $1 OR vendor_id = $1', [id]);
        await pool.query('DELETE FROM market_items WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM post_comments WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM post_likes WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM news_feed_posts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM gallery_posts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM champions WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);
        await pool.query('DELETE FROM conversations WHERE participant1_id = $1 OR participant2_id = $1', [id]);
        await pool.query('DELETE FROM connections WHERE follower_id = $1 OR following_id = $1', [id]);
        await pool.query('DELETE FROM dream_members WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM dream_tasks WHERE dream_id IN (SELECT id FROM dreams WHERE user_id = $1)', [id]);
        await pool.query('DELETE FROM dreams WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        console.error("Failed to delete user", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.delete('/api/admin/dreams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM dream_tasks WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM dream_members WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM news_feed_posts WHERE dream_id = $1', [id]);
        await pool.query('DELETE FROM dreams WHERE id = $1', [id]);
        res.json({ success: true, message: 'Dream deleted successfully' });
    } catch (error: any) {
        console.error("Failed to delete dream", error);
        res.status(500).json({ error: "Failed to delete dream" });
    }
});

app.get('/api/newsfeed', async (req, res) => {
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

app.get('/api/market-items', async (req, res) => {
    try {
        const itemsRes = await pool.query(`
            SELECT m.id, m.title, m.category, m.price, m.is_premium, m.is_active, m.created_at, u.username as vendor_name, u.vendor_tier
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

app.listen(port, () => {
    console.log(`Admin Server running on port ${port}`);
});
