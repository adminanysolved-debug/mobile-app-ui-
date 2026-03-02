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
            SELECT id, email, username, full_name, auth_provider, is_vendor, subscription_tier, created_at 
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

app.listen(port, () => {
    console.log(`Admin Server running on port ${port}`);
});
