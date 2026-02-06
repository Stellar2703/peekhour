import express from 'express';
import {
  createReport,
  getReports,
  reviewReport,
  banUser,
  unbanUser,
  getModerationLogs,
} from '../controllers/moderationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Reporting
router.post('/reports', authenticate, createReport);
router.get('/reports', authenticate, getReports); // Admin only
router.post('/reports/:reportId/review', authenticate, reviewReport); // Admin only

// User banning
router.post('/users/:userId/ban', authenticate, banUser); // Admin only
router.post('/users/:userId/unban', authenticate, unbanUser); // Admin only

// Logs
router.get('/logs', authenticate, getModerationLogs); // Admin only

export default router;
