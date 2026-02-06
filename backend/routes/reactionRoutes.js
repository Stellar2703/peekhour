import express from 'express';
import {
  togglePostReaction,
  getPostReactions,
  toggleCommentReaction,
  getCommentReactions
} from '../controllers/reactionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Post reactions
router.post('/posts/:id/react', authenticate, togglePostReaction);
router.get('/posts/:id/reactions', getPostReactions);

// Comment reactions
router.post('/comments/:id/react', authenticate, toggleCommentReaction);
router.get('/comments/:id/reactions', getCommentReactions);

export default router;
