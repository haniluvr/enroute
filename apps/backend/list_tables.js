const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listAllTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Tables in public schema:");
        console.table(res.rows);
        
        for (const row of res.rows) {
            const table = row.table_name;
            const columns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [table]);
            console.log(`\nColumns for ${table}:`);
            console.table(columns.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listAllTables().catch(console.error);
