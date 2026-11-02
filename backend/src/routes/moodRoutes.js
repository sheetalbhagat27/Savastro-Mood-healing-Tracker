import express from 'express';
import {
  getTodayMood,
  submitMood,
  getReport,
  populateDemo
} from '../controllers/moodController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/today', getTodayMood);
router.post('/', submitMood);
router.post('/demo', populateDemo);
router.get('/report', getReport);

export default router;
