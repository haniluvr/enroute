import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Default express setup
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (requires service account path later in env)
// admin.initializeApp({ credential: admin.credential.applicationDefault() });

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Enroute AI Backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
