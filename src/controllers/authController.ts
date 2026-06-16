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

if (existingUser) {

  // لو الحساب متفعل بالفعل
  if (existingUser.isVerified) {
    throw new ConflictError('User with this email already exists');
  }

  // لو الحساب غير متفعل
  const newCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  existingUser.verificationCode = newCode;

  existingUser.verificationCodeExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await existingUser.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailVal,
    subject: 'Verify Your Account',
    html: `
      <h2>Email Verification</h2>
      <h1>${newCode}</h1>
      <p>This code will expire in 10 minutes.</p>
    `,
  });

  sendSuccess(
  res,
  200,
  'A new verification code has been sent'
);

return;
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
        email: email.trim().toLowerCase(),
        verificationCode: code.trim(),
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
    throw new AuthenticationError("Please verify your email first");
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
    companyName: user.companyName
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


  export const resendVerificationCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new ValidationError("User not found");
    }

    if (user.isVerified) {
      throw new ValidationError("Email already verified");
    }
    

    const verificationCode = Math.floor(
  100000 + Math.random() * 900000
).toString();

console.log("GENERATED CODE =>", verificationCode);

user.verificationCode = verificationCode;

await user.save();

console.log(
  "CODE AFTER SAVE =>",
  user.verificationCode
);

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: user.email,
  subject: "Verify Your Account",
  html: `
    <h2>Email Verification</h2>
    <h1>${verificationCode}</h1>
    <p>This code will expire in 10 minutes.</p>
  `,
});

console.log(
  "EMAIL SENT WITH CODE =>",
  verificationCode
);

    sendSuccess(
      res,
      200,
      "Verification code sent successfully"
    );

    return;
  }
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new ValidationError("User not found");
    }

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.resetPasswordCode = resetCode;

    user.resetPasswordExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Password",
      html: `
        <h2>Reset Password</h2>
        <h1>${resetCode}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    sendSuccess(
      res,
      200,
      "Password reset code sent"
    );
  }
);

export const verifyResetCode = asyncHandler(
  async (req: Request, res: Response) => {

    const { email, code } = req.body;


    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordCode: code,
    });


    if (!user) {
      throw new ValidationError(
        "Invalid reset code"
      );
    }


    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new ValidationError(
        "Reset code expired"
      );
    }


    sendSuccess(
      res,
      200,
      "Code verified successfully"
    );
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      email,
      code,
      newPassword,
    } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordCode: code,
    });

    if (!user) {
      throw new ValidationError(
        "Invalid reset code"
      );
    }

    if (
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new ValidationError(
        "Reset code expired"
      );
    }

    user.password = newPassword;

    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    sendSuccess(
      res,
      200,
      "Password reset successfully"
    );
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
    throw new AuthenticationError("User not found");
  }

  sendSuccess(res, 200, "Profile fetched", {
    user: formatUserResponse(user)
  });
});
