import express from 'express';
import * as followController from '../controllers/followController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
// All routes require authentication
router.use(authenticate);

// Follow/unfollow
router.post('/follow/:userId', followController.followUser);
router.delete('/unfollow/:userId', followController.unfollowUser);

// Get followers/following
router.get('/:userId/followers', followController.getFollowers);
router.get('/:userId/following', followController.getFollowing);
router.get('/:userId/stats', followController.getFollowStats);
router.get('/check/:userId', followController.checkFollowing);

// Block/unblock
router.post('/block/:targetUserId', followController.blockUser);
router.delete('/unblock/:targetUserId', followController.unblockUser);
router.get('/blocked', followController.getBlockedUsers);

// Suggestions
router.get('/suggestions/users', followController.getSuggestedUsers);

export default router;
