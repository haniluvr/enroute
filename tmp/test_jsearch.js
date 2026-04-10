
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/backend/.env') });

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
const JSEARCH_API_HOST = process.env.JSEARCH_API_HOST;

async function test() {
    console.log('Testing JSearch Primary...');
    console.log('Key:', JSEARCH_API_KEY?.substring(0, 5) + '...');
    console.log('Host:', JSEARCH_API_HOST);

    try {
        const options = {
            method: 'GET',
            url: 'https://jsearch.p.rapidapi.com/search',
            params: {
                query: 'Software Engineer',
                page: '1',
                num_pages: '1',
            },
            headers: {
                'x-rapidapi-key': JSEARCH_API_KEY,
                'x-rapidapi-host': JSEARCH_API_HOST
            },
            timeout: 5000
        };
        const response = await axios.request(options);
        console.log('Success!', response.data.data?.length, 'jobs found.');
    } catch (error) {
        console.error('Failed:', error.response?.status, error.response?.data || error.message);
    }
}

test();
