import express from 'express';
import { body } from 'express-validator';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import {
  createCommentReply,
  getCommentReplies,
  getCommentThread
} from '../controllers/nestedCommentsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Validation rules
const addCommentValidation = [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('isBold').optional().isBoolean(),
  body('isItalic').optional().isBoolean()
];

// Routes
router.post('/posts/:postId/comments', authenticate, addCommentValidation, validate, addComment);
router.get('/posts/:postId/comments', getComments);
router.put('/comments/:id', authenticate, updateComment);
router.delete('/comments/:id', authenticate, deleteComment);

// Nested comment routes
router.post('/posts/:postId/comments/:parentCommentId/reply', authenticate, addCommentValidation, validate, createCommentReply);
router.get('/comments/:commentId/replies', optionalAuth, getCommentReplies);
router.get('/comments/:commentId/thread', optionalAuth, getCommentThread);

export default router;
