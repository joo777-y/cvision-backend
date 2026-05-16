import { Router } from 'express';
import { verifyEmail } from '../controllers/authController';
import {
  register,
  login,
  getProfile,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
} from '../middlewares/validation';
import { validate } from '../middlewares/validateRequest';
import { approveHR } from "../controllers/authController";

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/verify-email', verifyEmail);
router.patch("/approve/:id", approveHR);
router.get('/profile', authenticate, getProfile);
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  changePassword
);

export default router;
