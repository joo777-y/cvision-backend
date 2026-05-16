import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';

import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import cvRoutes from './routes/cvRoutes';
import skillsRoutes from './routes/skillsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import candidatesRoutes from "./routes/candidatesRoutes";

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (no /api prefix)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// API routes
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
