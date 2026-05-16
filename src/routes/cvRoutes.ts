import { Router } from 'express';
import {
  uploadCV,
  getCVs,
  getCVById,
  downloadCV,
  reprocessCV,
  rejectCV,
  acceptCV,
  deleteCV,
} from '../controllers/cvController';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { mongoIdValidation, paginationValidation } from '../middlewares/validation';
import { validate } from '../middlewares/validateRequest';

const router = Router();

// ───────────────── PUBLIC ROUTE ─────────────────
router.post(
  '/upload',
  upload.single('cv'),
  uploadCV
);

// ───────────────── PROTECTED ROUTES ─────────────────
router.use(authenticate);

router.get(
  '/',
  authorize('hr'),
  paginationValidation,
  validate,
  getCVs
);

router.get(
  '/:id',
  authorize('hr'),
  mongoIdValidation,
  validate,
  getCVById
);

router.get(
  '/:id/download',
  authorize('hr'),
  mongoIdValidation,
  validate,
  downloadCV
);

router.post(
  '/:id/reprocess',
  authorize('hr'),
  mongoIdValidation,
  validate,
  reprocessCV
);

router.post(
  '/:id/reject',
  authorize('hr'),
  mongoIdValidation,
  validate,
  rejectCV
);

router.post(
  '/:id/accept',
  authorize('hr'),
  mongoIdValidation,
  validate,
  acceptCV
);

router.delete(
  '/:id',
  authorize('hr'),
  mongoIdValidation,
  validate,
  deleteCV
);

export default router;