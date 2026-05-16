import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types';

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};
