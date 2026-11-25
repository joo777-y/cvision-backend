import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { sendError } from './utils/response';

import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import cvRoutes from './routes/cvRoutes';
import skillsRoutes from './routes/skillsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import candidatesRoutes from "./routes/candidatesRoutes";


const app: Application = express();
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// CORS
const defaultCorsOrigins = [
  "http://localhost:5173",
  "https://c-vision-one.vercel.app",
];
const envCorsOrigins =
  config.cors.origin
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];
const allowedOrigins = Array.from(
  new Set([...defaultCorsOrigins, ...envCorsOrigins])
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs:  60 * 1000,
  max: 100,

   keyGenerator: (req) => {

    return req.ip?.split(":")[0] || "unknown";

  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many requests from this IP, please try again later",
    });
  },
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many login attempts, please try again later",
    });
  },
});

  const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message:
          "Too many registration attempts, please try again later",
      });
    },
  });

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (no /api prefix)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Reject API requests cleanly while MongoDB is connecting or disconnected
app.use('/api', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    sendError(res, 503, 'Service temporarily unavailable: database not connected');
    return;
  }
  next();
});

// API routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/candidates", candidatesRoutes);

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

export default app;
