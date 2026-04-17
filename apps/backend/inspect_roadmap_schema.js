const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function getTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true }
    });
    try {
        await client.connect();
        const tables = ['learning_paths', 'learning_modules'];
        for (const table of tables) {
            console.log(`\n--- TABLE: ${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [table]);
            console.log(JSON.stringify(res.rows, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getTables().catch(console.error);
