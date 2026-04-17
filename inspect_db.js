const { Client } = require('pg');
const connectionString = "postgresql://postgres.rmaddogdctwpxdpphnzr:Toj4q5fPnGlQrrHI@aws-1-ap-southeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true";

async function inspect() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'conversations'
            ORDER BY ordinal_position;
        `);
        console.log("Conversations columns:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
inspect();
