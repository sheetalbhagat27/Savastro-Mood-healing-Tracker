import express from 'express';
import { getGuides } from '../controllers/guideController.js';

const router = express.Router();

router.get('/', getGuides);

export default router;
