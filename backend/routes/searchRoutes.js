import express from 'express';
import {
  advancedSearch,
  getTrending,
  getExplore,
  getSuggestedUsers,
} from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', advancedSearch);
router.get('/trending', getTrending);
router.get('/explore', getExplore);
router.get('/suggested-users', authenticate, getSuggestedUsers);

export default router;
