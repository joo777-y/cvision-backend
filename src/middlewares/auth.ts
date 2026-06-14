import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { AuthRequest, UserRole } from '../types';
import { User } from "../models";

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    };

    next();
  } catch {
    next(new AuthenticationError("Invalid or expired token"));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError(
        'You do not have permission to perform this action'
      );
    }

    next();
  };
};
