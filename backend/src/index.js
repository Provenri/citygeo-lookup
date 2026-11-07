import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db.js';
import authRouter from './routes/auth.js';
import geocodeRouter from './routes/geocode.js';
import historyRouter from './routes/history.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}
if (!process.env.NOMINATIM_CONTACT) {
  throw new Error('NOMINATIM_CONTACT must be configured with a contact email or URL');
}

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/geocode/history', historyRouter);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
