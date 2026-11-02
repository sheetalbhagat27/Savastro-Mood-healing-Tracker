import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import { connectDatabase } from './config/database.js';
import { ensureProsSeeded } from './models/Pro.js';
import authRoutes from './routes/authRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { login } from './controllers/authController.js';
import { authLimiter } from './middleware/rateLimiter.js';
import { getReport, populateDemo } from './controllers/moodController.js';
import { getNotification } from './controllers/activityController.js';
import { requireAuth } from './middleware/auth.js';

const app = express();

// Disable x-powered-by header for security
app.disable('x-powered-by');

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://savastro-mood-healing-tracker-egjn.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, logged in headers
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user', 'x-auth-token'],
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/pros', guideRoutes);

// Direct compatibility endpoints matching original routes
app.post('/api/login', authLimiter, login);
app.get('/api/report', requireAuth, getReport);
app.post('/api/demo', requireAuth, populateDemo);
app.get('/api/notify', requireAuth, getNotification);

// 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route '${req.originalUrl}' not found` });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureProsSeeded();
  } catch (err) {
    console.warn('[Startup Notice] Running with limited DB connectivity:', err.message);
  }

  // Only listen when run directly (not when imported in tests)
  const isDirectRun =
    process.argv[1] &&
    path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();

  if (isDirectRun && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Savastro Mood & Healing Backend`);
      console.log(` Running on: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  }
};

startServer();

export default app;
export { app };
