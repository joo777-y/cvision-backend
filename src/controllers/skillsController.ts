import { Response } from 'express';
import { SkillsDictionary } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../types';
import { loadSkillsDictionary } from '../services/nlpService';

// Get all skills
export const getSkills = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const category = req.query.category as string;

    const query: any = {};
    if (category) {
      query.category = category;
    }

    const skills = await SkillsDictionary.find(query)
      .populate('updatedBy', 'firstName lastName email')
      .sort({ category: 1 });

    sendSuccess(res, 200, 'Skills fetched successfully', { skills });
  }
);

// Get skill by ID
export const getSkillById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const skill = await SkillsDictionary.findById(id).populate(
      'updatedBy',
      'firstName lastName email'
    );

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    sendSuccess(res, 200, 'Skill fetched successfully', { skill });
  }
);

// Create new skill
export const createSkill = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { category, skills, synonyms } = req.body;

    const skill = await SkillsDictionary.create({
      category,
      skills,
      synonyms: synonyms || {},
      updatedBy: userId,
    });

    // Reload skills cache
    await loadSkillsDictionary();

    sendSuccess(res, 201, 'Skill created successfully', { skill });
  }
);

// Update skill
export const updateSkill = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const skill = await SkillsDictionary.findById(id);

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    const updatedSkill = await SkillsDictionary.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    // Reload skills cache
    await loadSkillsDictionary();

    sendSuccess(res, 200, 'Skill updated successfully', {
      skill: updatedSkill,
    });
  }
);

// Delete skill
export const deleteSkill = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const skill = await SkillsDictionary.findById(id);

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    await SkillsDictionary.findByIdAndDelete(id);

    // Reload skills cache
    await loadSkillsDictionary();

    sendSuccess(res, 200, 'Skill deleted successfully');
  }
);

// Import skills from JSON
export const importSkills = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { category, skills, synonyms } = req.body;

    // Check if category already exists
    const existing = await SkillsDictionary.findOne({ category });

    if (existing) {
      // Update existing
      await SkillsDictionary.findByIdAndUpdate(existing._id, {
        skills,
        synonyms: synonyms || {},
        updatedBy: userId,
        updatedAt: new Date(),
      });
    } else {
      // Create new
      await SkillsDictionary.create({
        category,
        skills,
        synonyms: synonyms || {},
        updatedBy: userId,
      });
    }

    // Reload skills cache
    await loadSkillsDictionary();

    sendSuccess(res, 200, 'Skills imported successfully');
  }
);
