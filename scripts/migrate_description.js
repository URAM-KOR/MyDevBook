const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2 && !line.startsWith('#')) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            process.env[key] = value;
        }
    });
}

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fairyquest',
    user: process.env.DB_USER || 'fairyquest_user',
    password: process.env.DB_PASSWORD || 'fairyquest_pass_2024',
});

async function run() {
    try {
        console.log('Migrating DB...');
        const client = await pool.connect();
        await client.query('ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS description TEXT;');
        console.log('Success: Added description column.');
        client.release();
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
