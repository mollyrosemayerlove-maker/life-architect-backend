import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import scheduleRoutes from './routes/schedule.js';
import chatRoutes from './routes/chat.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5174', 'http://localhost:5175'] }));
app.use(bodyParser.json());

// Main route hooks
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportsRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: "Route not found", code: "NOT_FOUND" });
});

// Catch all errors
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, error: "Server error", code: "SERVER_ERROR" });
});

app.listen(PORT, async () => {
  console.log(`Life Architect backend running on http://localhost:${PORT}`);
  try {
    const dbRes = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', dbRes.rows[0].now);
  } catch (err) {
    console.error('Initial DB connection failed:', err.message);
  }
});
