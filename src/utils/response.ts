import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export const sendSuccess = <T = any>(
  res: Response,
  statusCode: number,
  message?: string,
  data?: T
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
