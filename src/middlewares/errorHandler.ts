import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error:', err);

  if (err instanceof AppError) {
    // Operational errors
    sendError(res, err.statusCode, err.message);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    sendError(res, 400, 'Validation Error', err.message);
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    sendError(res, 409, 'Duplicate field value entered');
    return;
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    sendError(res, 400, 'Invalid ID format');
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 401, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 401, 'Token expired');
    return;
  }

  // Unknown errors
  sendError(
    res,
    500,
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  );
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};
