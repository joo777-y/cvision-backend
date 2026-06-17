import mongoose, { Schema } from 'mongoose';
import { IJob } from '../types';

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: {
      type: String,
      trim: true,
    },
    responsibilities: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    workplaceType: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'onsite',
    },
        jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    salaryRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },
    requiredSkills: {
      technical: {
        type: [
          {
            name: { type: String, required: true },
            weight: { type: Number, required: true, min: 0, max: 10, default: 5 },
          },
        ],
        default: [],
      },
      soft: {
        type: [
          {
            name: { type: String, required: true },
            weight: { type: Number, required: true, min: 0, max: 10, default: 5 },
          },
        ],
        default: [],
      },
    },
    requiredExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    requiredEducation: {
        type: String,
        default: 'Other',
      },
    benefits: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
jobSchema.index({ status: 1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);
