import type { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'hr' | 'candidate';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isApproved: boolean;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  companyName?: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  workplaceType?: 'remote' | 'hybrid' | 'onsite';
  location?: string;
  jobType?: string;
  department?: string;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  requiredSkills: {
    technical: Array<{ name: string; weight: number }>;
    soft: Array<{ name: string; weight: number }>;
  };
  requiredExperience: number;
  requiredEducation: string;
  benefits?: string;
  status: 'active' | 'closed' | 'draft';
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface ICV extends Document {
  _id: Types.ObjectId;
  candidateId?: Types.ObjectId;

  fullName: string;
  email: string;
  jobId: Types.ObjectId;
  fileName: string;
  fileId: Types.ObjectId;
  phoneNumber?: string;
  whatsappNumber?: string;
  mimeType?: string;
  coverLetter?: string;
  parsedData: {
    rawText: string;
    extractedSkills: {
      technical: string[];
      soft: string[];
    };
    experience: number;
    education: string;
  };
  matchingScore: number;
  scoreBreakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
  };
  status: 'pending' | 'processed' | 'rejected';
  uploadedAt: Date;
  processedAt?: Date;
}

export interface ISkillsDictionary extends Document {
  _id: Types.ObjectId;
  category: 'technical' | 'soft';
  skills: string[];
  synonyms: { [key: string]: string[] };
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    isApproved?: boolean;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  firstName?: string;
  companyName?: string;
  role: UserRole;
  isApproved?: boolean;
}

export interface ParsedCV {
  rawText: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  experience: number;
  education: string;
}

export interface MatchingScore {
  total: number;
  breakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
  };
}
