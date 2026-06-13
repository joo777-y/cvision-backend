import { Request, Response } from 'express';
import { User } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';
import { generateAccessToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { transporter } from '../services/emailService';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
} from '../utils/errors';
import { JWTPayload, AuthRequest } from '../types';

// Helper to format user for response (Figma: fullName, email, companyName, role)
const formatUserResponse = (user: any) => ({
  id: user._id,
  fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.firstName,
  email: user.email,
  companyName: user.companyName,
  role: user.role,
  isApproved: user.isApproved,
});

// Register new user - accepts fullName/emailAddress (Figma) or firstName,lastName/email
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    fullName,
    firstName,
    lastName,
    email,
    emailAddress,
    password,
    companyName,
    companyWebsite,
    linkedinUrl,
    role,
  } = req.body;

  const emailVal = (email || emailAddress || '').trim().toLowerCase();
  if (!emailVal) {
    throw new ValidationError('Email or emailAddress is required');
  }

  let firstNameVal: string;
  let lastNameVal: string;
  if (fullName?.trim()) {
    const parts = (fullName as string).trim().split(/\s+/);
    firstNameVal = parts[0] || '';
    lastNameVal = parts.slice(1).join(' ') || parts[0] || '';
  } else if (firstName?.trim() && lastName?.trim()) {
    firstNameVal = firstName.trim();
    lastNameVal = lastName.trim();
  } else {
    throw new ValidationError('fullName or (firstName and lastName) is required');
  }

  const allUsers = await User.find({});

console.log("TOTAL USERS:", allUsers.length);

console.log(
  "EMAILS:",
  allUsers.map((u) => u.email)
);

const existingUser = await User.findOne({ email: emailVal });

console.log("EXISTING USER:", existingUser);

console.log("EMAIL SEARCH =>", emailVal);
console.log("FOUND USER =>", existingUser);

if (existingUser) {
  throw new ConflictError('User with this email already exists');
}

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const user = await User.create({
    email: emailVal,
    password,

    firstName: firstNameVal,
    lastName: lastNameVal,

    companyName: companyName?.trim() || undefined,
    companyWebsite,
    linkedinUrl,

    role: role,

    isVerified: false,
    isApproved: false,

    verificationCode,

    verificationCodeExpires: new Date(
      Date.now() + 10 * 60 * 1000
    ),
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailVal,
    subject: 'Verify Your Account',

    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>

      <h1>${verificationCode}</h1>

      <p>This code will expire in 10 minutes.</p>
    `,
  });

  sendSuccess(res, 201, 'Verification code sent to email', {
    email: user.email,
  });
});

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        verificationCode: code,
      });

      if (!user) {
        throw new ValidationError('Invalid verification code');
      }

      if (
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date()
      ) {
        throw new ValidationError('Verification code expired');
      }

      user.isVerified = true;

      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;

      await user.save();

      sendSuccess(res, 200, 'Email verified successfully');
    }
  );

// Login user - accepts email or emailAddress
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, emailAddress, password } = req.body;

  const emailVal = (email || emailAddress || '').trim().toLowerCase();
  if (!emailVal || !password) {
    throw new ValidationError('Email and password are required');
  }

  const user = await User.findOne({ email: emailVal }).select('+password');
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }
  if (!user.isVerified) {
    throw new AuthenticationError(
      'Please verify your email first'
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const tokenPayload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    companyName: user.companyName,
    isApproved: user.isApproved,
  };

  const accessToken = generateAccessToken(tokenPayload);

  sendSuccess(res, 200, 'Login successful', {
    user: formatUserResponse(user),
    accessToken,
  });
});

// Change password
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, 200, 'Password changed successfully');
  }
);

export const approveHR = asyncHandler(async (req, res): Promise<void> => {

  const user = await User.findById(req.params.id);

  if (!user) {
    sendError(res, 404, "User not found");
    return;
  }

  user.isApproved = true;

  await user.save();

  sendSuccess(res, 200, "HR approved successfully", user);

  return;
});


// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as any;
  const userId = authReq.user.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  sendSuccess(res, 200, 'Profile fetched successfully', {
    user: {
      ...formatUserResponse(user),
      createdAt: user.createdAt,
    },
  });
});
