import express from 'express';
import {
  getActivities,
  createActivity,
  updateProgress,
  completeActivity,
  postponeActivity,
  getNotification
} from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getActivities);
router.post('/', createActivity);
router.get('/notify', getNotification);
router.post('/:id/progress', updateProgress);
router.post('/:id/complete', completeActivity);
router.post('/:id/later', postponeActivity);

export default router;
