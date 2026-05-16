import { body, param, query, ValidationChain } from 'express-validator';


// Auth validation - accepts fullName/emailAddress (Figma) or firstName,lastName/email
export const registerValidation: ValidationChain[] = [
  body('fullName')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters'),

  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  
  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email format'),

  body('emailAddress').optional().isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('companyName')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.role === 'hr' && !value?.trim()) {
        throw new Error('Company name is required for HR role');
      }
      return true;
    }),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['hr'])
    .withMessage('Registration is for HR only'),
  body().custom((_value, { req }) => {
    const hasFullName = req.body.fullName?.trim();
    const hasFirstLast =
      req.body.firstName?.trim() && req.body.lastName?.trim();
    if (!hasFullName && !hasFirstLast) {
      throw new Error('fullName or (firstName and lastName) is required');
    }
    const hasEmail = req.body.email?.trim() || req.body.emailAddress?.trim();
    if (!hasEmail) {
      throw new Error('email or emailAddress is required');
    }
    return true;
  }),
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('emailAddress')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((_value, { req }) => {
    if (!req.body.email?.trim() && !req.body.emailAddress?.trim()) {
      throw new Error('email or emailAddress is required');
    }
    return true;
  }),
];

export const changePasswordValidation: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Job validation - accepts jobTitle/jobDescription (Figma) or title/description
export const createJobValidation: ValidationChain[] = [
  body('title').optional().trim().notEmpty(),
  body('jobTitle').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('jobDescription').optional().trim().notEmpty(),
  body('requirements').optional().trim(),
  body('responsibilities').optional().trim(),
  body('location').optional().trim(),
  body('jobType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .withMessage('Invalid job type'),
  body('requiredSkills.technical').optional().isArray(),
  body('requiredSkills.soft').optional().isArray(),
  body('requiredExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  body('benefits').optional().trim(),
  body('requiredEducation')
    .optional()
    .isIn(['High School', 'Bachelor', 'Master', 'PhD', 'Other'])
    .withMessage('Invalid education level'),
  body('status')
    .optional()
    .isIn(['active', 'closed', 'draft'])
    .withMessage('Invalid status'),
  body().custom((_value, { req }) => {
    const hasTitle = req.body.title?.trim() || req.body.jobTitle?.trim();
    const hasDesc =
      req.body.description?.trim() || req.body.jobDescription?.trim();
    if (!hasTitle) throw new Error('title or jobTitle is required');
    if (!hasDesc) throw new Error('description or jobDescription is required');
    return true;
  }),
];

export const updateJobValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('location').optional().trim(),
  body('jobType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship'])
    .withMessage('Invalid job type'),
  body('requiredExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  body('benefits').optional().trim(),
  body('requiredEducation')
    .optional()
    .isIn(['High School', 'Bachelor', 'Master', 'PhD', 'Other'])
    .withMessage('Invalid education level'),
];

// Skills validation
export const createSkillValidation: ValidationChain[] = [
  body('category')
    .isIn(['technical', 'soft'])
    .withMessage('Category must be technical or soft'),
  body('skills').isArray().withMessage('Skills must be an array'),
  body('skills.*').trim().notEmpty().withMessage('Skill cannot be empty'),
];

// Common validations
export const mongoIdValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
