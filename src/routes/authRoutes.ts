import { Router } from 'express';
import { forgotPassword, resendVerificationCode, resetPassword, verifyEmail } from '../controllers/authController';
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
router.post(
  "/resend-verification",
  resendVerificationCode
);
router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);
router.patch("/approve/:id", authenticate, approveHR);
router.get('/profile', authenticate, getProfile);
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  changePassword
);

export default router;
