import express from 'express';
import {
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  markAsRead,
  createGroupConversation,
  deleteConversation
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Conversations
router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getConversations);
router.post('/conversations/group', createGroupConversation);
router.delete('/conversations/:conversationId', deleteConversation);

// Messages
router.post('/conversations/:conversationId/messages', uploadMedia.single('media'), sendMessage);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/read', markAsRead);

export default router;
