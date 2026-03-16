const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function seedData() {
    console.log('Starting seed process...');
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const csvFilePath = path.join(__dirname, '../../../../datasets/cv_jobs_train.csv');
        console.log('Reading file:', csvFilePath);
        
        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    if (results.length < 50) {
                        results.push(data);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Parsed ${results.length} records. Starting insertion...`);

        for (const record of results) {
            const lines = record.job_description_text.split('\n');
            const title = lines[0].substring(0, 100).trim() || 'Career Opportunity';
            const description = record.job_description_text;
            const company = 'Global Corp';
            
            const query = `
                INSERT INTO public.jobs (company_name, role_title, description, is_active)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
            `;

            await client.query(query, [company, title, description, true]);
        }

        console.log('Seeding completed successfully');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seedData();
