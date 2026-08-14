import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
});

// Optional: Test the connection
pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

export default pool;