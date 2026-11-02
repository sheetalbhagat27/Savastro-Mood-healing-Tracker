import express from 'express';
import { getDbStatus } from '../config/database.js';
import { getEmailConfig } from '../config/email.js';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  const emailConfig = getEmailConfig();

  res.json({
    status: 'ok',
    service: 'Savastro Mood & Healing Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbStatus.connected,
      readyState: dbStatus.readyState
    },
    emailService: {
      configured: emailConfig.isConfigured
    }
  });
});

export default router;
