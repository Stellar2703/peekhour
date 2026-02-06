import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:notificationId/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);
router.delete('/:notificationId', authenticate, deleteNotification);

// Notification settings
router.get('/settings', authenticate, getNotificationSettings);
router.patch('/settings', authenticate, updateNotificationSettings);

export default router;
