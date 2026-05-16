import { Router } from 'express';
import {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobCandidates,
} from '../controllers/jobController';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createJobValidation,
  updateJobValidation,
  mongoIdValidation,
  paginationValidation,
} from '../middlewares/validation';
import { validate } from '../middlewares/validateRequest';
import { checkHRApproval } from "../middlewares/checkHRApproval";

const router = Router();

// Public: job list and details (for candidate job search without login)
router.get(
  '/',
  paginationValidation,
  validate,
  getJobs
);

router.get(
  '/my-jobs',
  authenticate,
  authorize('hr'),
  paginationValidation,
  validate,
  getMyJobs
);

router.get('/:id', mongoIdValidation, validate, getJobById);

// Protected: create, update, delete (HR only)
router.post(
  '/',
  authenticate,
  authorize('hr'),
  checkHRApproval,
  createJobValidation,
  validate,
  createJob
);

router.put(
  '/:id',
  authenticate,
  authorize('hr'),
  updateJobValidation,
  validate,
  updateJob
);

router.delete(
  '/:id',
  authenticate,
  authorize('hr'),
  mongoIdValidation,
  validate,
  deleteJob
);

router.get(
  '/:id/candidates',
  authenticate,
  authorize('hr'),
  mongoIdValidation,
  paginationValidation,
  validate,
  getJobCandidates
);

export default router;
