import mongoose, { Schema } from 'mongoose';
import { ISkillsDictionary } from '../types';

const skillsDictionarySchema = new Schema<ISkillsDictionary>(
  {
    category: {
      type: String,
      enum: ['technical', 'soft'],
      required: true,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    synonyms: {
      type: Map,
      of: [String],
      default: {},
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster category lookups
skillsDictionarySchema.index({ category: 1 });

export const SkillsDictionary = mongoose.model<ISkillsDictionary>(
  'SkillsDictionary',
  skillsDictionarySchema
);
