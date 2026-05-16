import { Router } from 'express';
import {
  getDashboardStats,
  getRecentActivities,
} from '../controllers/dashboardController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication and hr role
router.use(authenticate, authorize('hr'));

router.get('/stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);

export default router;
