import express from 'express';
import {
  createStory,
  getStories,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory,
  deleteExpiredStories,
} from '../controllers/storyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Story operations
router.post('/', authenticate, createStory);
router.get('/', authenticate, getStories);
router.get('/user/:userId', authenticate, getUserStories);
router.post('/:storyId/view', authenticate, viewStory);
router.get('/:storyId/viewers', authenticate, getStoryViewers);
router.delete('/:storyId', authenticate, deleteStory);

// Admin/cron endpoint
router.post('/cleanup/expired', deleteExpiredStories);

export default router;
