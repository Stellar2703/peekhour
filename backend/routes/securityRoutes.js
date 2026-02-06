import express from 'express';
import {
  enable2FA,
  verify2FA,
  disable2FA,
  getLoginHistory,
  getActiveSessions,
  terminateSession,
  getPrivacySettings,
  updatePrivacySettings,
} from '../controllers/securityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 2FA
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);

// Sessions and history
router.get('/login-history', authenticate, getLoginHistory);
router.get('/sessions', authenticate, getActiveSessions);
router.delete('/sessions/:sessionId', authenticate, terminateSession);

// Privacy settings
router.get('/privacy', authenticate, getPrivacySettings);
router.patch('/privacy', authenticate, updatePrivacySettings);

export default router;
