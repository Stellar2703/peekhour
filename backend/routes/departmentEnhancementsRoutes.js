import express from 'express';
import {
  addModerator,
  removeModerator,
  getModerators,
  updateModeratorPermissions,
  createEvent,
  getEvents,
  rsvpEvent,
  getEventAttendees,
  submitPostForApproval,
  getPendingPosts,
  reviewPendingPost,
  updateDepartmentSettings
} from '../controllers/departmentEnhancementsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Moderator management
router.post('/:departmentId/moderators', authenticate, addModerator);
router.delete('/:departmentId/moderators/:moderatorId', authenticate, removeModerator);
router.get('/:departmentId/moderators', authenticate, getModerators);
router.patch('/:departmentId/moderators/:moderatorId/permissions', authenticate, updateModeratorPermissions);

// Event management
router.post('/:departmentId/events', authenticate, createEvent);
router.get('/:departmentId/events', getEvents);
router.post('/events/:eventId/rsvp', authenticate, rsvpEvent);
router.get('/events/:eventId/attendees', getEventAttendees);

// Post approval workflow
router.post('/posts/submit', authenticate, submitPostForApproval);
router.get('/:departmentId/pending-posts', authenticate, getPendingPosts);
router.post('/posts/:postId/review', authenticate, reviewPendingPost);

// Department settings
router.patch('/:departmentId/settings', authenticate, updateDepartmentSettings);

export default router;
