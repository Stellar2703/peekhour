import express from 'express';
import { getUserProfile, getUserPosts, getUserActivity } from '../controllers/profileController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes use optional auth (works for both authenticated and non-authenticated users)
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.get('/:username/activity', optionalAuth, getUserActivity);

export default router;
