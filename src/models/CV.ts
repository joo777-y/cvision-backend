import mongoose, { Schema } from 'mongoose';
import { ICV } from '../types';

const cvSchema = new Schema<ICV>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },

    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    coverLetter: {
      type: String,
    },
    parsedData: {
      rawText: {
        type: String,
        default: '',
      },
      extractedSkills: {
        technical: [String],
        soft: [String],
      },
      experience: {
        type: Number,
        default: 0,
      },
      education: {
        type: String,
        default: '',
      },
    },
    matchingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      skillsScore: {
        type: Number,
        default: 0,
      },
      experienceScore: {
        type: Number,
        default: 0,
      },
      educationScore: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'rejected'],
      default: 'pending',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    mimeType: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
  
);

// Indexes for faster queries
cvSchema.index({ candidateId: 1 });
cvSchema.index({ jobId: 1 });
cvSchema.index({ status: 1 });
cvSchema.index({ matchingScore: -1 });
cvSchema.index({ uploadedAt: -1 });

// Compound index for job-specific queries
cvSchema.index({ jobId: 1, matchingScore: -1 });

export const CV = mongoose.model<ICV>('CV', cvSchema);
