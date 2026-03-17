const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function inspect() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        console.log("--- TABLE: conversations ---");
        const res1 = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'conversations'
            ORDER BY ordinal_position;
        `);
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log("--- TABLE: conversation_messages ---");
        const res2 = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'conversation_messages'
            ORDER BY ordinal_position;
        `);
        console.log(JSON.stringify(res2.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
inspect();
