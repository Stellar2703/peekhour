import express from 'express';
import {
  getUserAnalytics,
  getPostAnalytics,
  getDepartmentAnalytics,
  trackEvent,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/user', authenticate, getUserAnalytics);
router.get('/post/:postId', authenticate, getPostAnalytics);
router.get('/department/:departmentId', authenticate, getDepartmentAnalytics);
router.post('/track', trackEvent);

export default router;
