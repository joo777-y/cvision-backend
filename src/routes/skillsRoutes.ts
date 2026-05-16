import { Router } from 'express';
import {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  importSkills,
} from '../controllers/skillsController';
import { authenticate, authorize } from '../middlewares/auth';
import { createSkillValidation, mongoIdValidation } from '../middlewares/validation';
import { validate } from '../middlewares/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read operations - accessible by all authenticated users
router.get('/', getSkills);
router.get('/:id', mongoIdValidation, validate, getSkillById);

// Write operations - HR only
router.post(
  '/',
  authorize('hr'),
  createSkillValidation,
  validate,
  createSkill
);

router.put(
  '/:id',
  authorize('hr'),
  mongoIdValidation,
  validate,
  updateSkill
);

router.delete(
  '/:id',
  authorize('hr'),
  mongoIdValidation,
  validate,
  deleteSkill
);

router.post('/import', authorize('hr'), importSkills);

export default router;
