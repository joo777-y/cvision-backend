import { Response } from 'express';
import mongoose from 'mongoose';
import { CV, Job } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../types';
import {
  uploadFileToGridFS,
  downloadFileFromGridFS,
  deleteFileFromGridFS,
  streamFileFromGridFS,
} from '../services/gridfsService';
import {
  parseCV,
  extractExperience,
  extractEducation,
} from '../services/parsingService';
import { extractSkills } from '../services/nlpService';
import { calculateMatchingScore } from '../services/scoringService';
import { analyzeCVWithAI } from '../services/aiParsingService';
import { runAIMatching } from '../services/aiMatchingService';

// Upload CV
export const uploadCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId || null;
    const { jobId, fullName, email, phoneNumber, whatsappNumber, coverLetter } =
      req.body;

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    if (!jobId) {
      throw new ValidationError('Job ID is required');
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Upload file to GridFS
    const fileId = await uploadFileToGridFS(
      req.file.buffer,
      req.file.originalname,
      {
        contentType: req.file.mimetype,
        uploadedBy: userId,
      }
    );
    console.log('UPLOAD DATA:', {
      fullName,
      email,
      phoneNumber,
    });

    // Create CV record
    const cv = await CV.create({
      candidateId: userId,
      jobId,
      fullName,
      email,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileId,
      phoneNumber: phoneNumber || undefined,
      whatsappNumber: whatsappNumber || undefined,
      coverLetter: coverLetter || undefined,
      status: 'pending',
    });

    // Process CV asynchronously
    processCV(cv._id, req.file.buffer, req.file.mimetype, job._id)
      .then(() => {
        console.log(`✅ CV ${cv._id} processed successfully`);
      })
      .catch((error) => {
        console.error(`❌ Error processing CV ${cv._id}:`, error);
      });

    sendSuccess(res, 201, 'Application submitted successfully', {
      applicationId: cv._id,
      status: 'pending',
    });
  }
);

// Process CV (async function)
const processCV = async (
  cvId: mongoose.Types.ObjectId,
  fileBuffer: Buffer,
  mimeType: string,
  jobId: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    // Parse CV to extract text
    const rawText = await parseCV(fileBuffer, mimeType);

    // Analyze CV using Gemini AI
    let aiProfile = null;

    try {
      aiProfile = await analyzeCVWithAI(rawText);

      console.log('🔥 AI PROFILE:', aiProfile);
    } catch (error) {
      console.error('🔥 GEMINI ERROR FULL:', error);
    }

    // Extract skills using NLP
    const extractedSkills = await extractSkills(rawText);

    console.log('RAW TEXT HAS REACT?', rawText.includes('React'));
    console.log('SKILLS RESULT:', extractedSkills);

    // Extract experience and education
    const experience =
      extractExperience(rawText) || (aiProfile?.experience ? 1 : 0);
    const education = extractEducation(rawText);

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Calculate matching score
    // Calculate matching score
    const score = calculateMatchingScore(
      {
        skills: {
          technical: aiProfile?.technicalSkills || [],
          soft: aiProfile?.softSkills || [],
        },
        experience,
        education,
      },
      job
    );

    // AI Semantic Matching
    let aiMatch = null;

    try {
      if (aiProfile) {
        aiMatch = await runAIMatching(aiProfile, job);

        console.log('AI MATCH RESULT:', JSON.stringify(aiMatch, null, 2));
      }
    } catch (error) {
      console.error('AI Matching failed:', error);
    }

    // Update CV with parsed data and score
    await CV.findByIdAndUpdate(cvId, {
      parsedData: {
        rawText,

        extractedSkills,

        experience,

        education,

        aiAnalysis: aiProfile,
      },

      matchingScore:
        aiMatch?.matchScore !== undefined
          ? aiMatch.matchScore <= 1
            ? aiMatch.matchScore * 100
            : aiMatch.matchScore
          : score.total,

      scoreBreakdown: {
        aiScore: aiMatch?.matchScore || score.total,

        skillsScore: aiMatch?.skillsScore ?? score.breakdown.skillsScore,

        experienceScore:
          aiMatch?.experienceScore ?? score.breakdown.experienceScore,

        educationScore:
          aiMatch?.educationScore ?? score.breakdown.educationScore,
      },

      aiMatching: aiMatch
        ? {
            matchedSkills: aiMatch.matchedSkills,

            missingSkills: aiMatch.missingSkills,

            explanation: aiMatch.explanation,
          }
        : undefined,

      status: 'processed',

      processedAt: new Date(),
    });
  } catch (error) {
    console.error('Error processing CV:', error);

    await CV.findByIdAndUpdate(cvId, {
      status: 'rejected',
    });
  }
};

// Map CV status to Figma display (Pending, Accepted, Rejected)
const cvStatusToDisplay = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'Pending',
    processed: 'Accepted',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

// Get all CVs - Figma All Candidates format: id, name, status, jobTitle, applicationDate
export const getCVs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const jobId = req.query.jobId as string;

  const query: any = {};
  if (status) query.status = status;
  if (jobId) query.jobId = jobId;

  const skip = (page - 1) * limit;

  const [cvs, total] = await Promise.all([
    CV.find(query)
      .populate('jobId', 'title')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CV.countDocuments(query),
  ]);

  const formattedCvs = (cvs as any[]).map((cv) => {
    // const candidate = cv.candidateId;
    const job = cv.jobId;
    return {
      id: cv._id,
      name: cv.fullName,
      phoneNumber: cv.phoneNumber,
      email: cv.email,
      status: cvStatusToDisplay(cv.status),
      jobTitle: job && typeof job === 'object' ? job.title : 'Unknown',
      applicationDate: cv.uploadedAt,
      appliedAt: cv.uploadedAt,
    };
  });

  sendSuccess(res, 200, 'CVs fetched successfully', {
    cvs: formattedCvs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get CV by ID - Figma candidate profile format
export const getCVById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findById(id)
      .populate('candidateId', 'firstName lastName email')
      .populate('jobId', 'title description requiredSkills');

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    const candidate = cv.candidateId as any;
    const skills = [
      ...(cv.parsedData?.aiAnalysis?.technicalSkills || []),

      ...(cv.parsedData?.aiAnalysis?.softSkills || []),
    ];

    const candidateProfile = {
      id: cv._id,
       status: cv.status,
      name:
        `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() ||
        cv.fullName,
      email: candidate.email || cv.email,
      phoneNumber: cv.phoneNumber,
      whatsappNumber: cv.whatsappNumber,
      title: (cv.jobId as any)?.title,
      cvScores: {
        overallScore: cv.matchingScore,
        skillMatch: cv.scoreBreakdown?.skillsScore ?? 0,
        experienceMatch: cv.scoreBreakdown?.experienceScore ?? 0,
        educationMatch: cv.scoreBreakdown?.educationScore ?? 0,
      },
      workExperience: [], // Parsed CV doesn't extract structured exp - could parse rawText later
      education: cv.parsedData?.education
        ? [
            {
              degree: cv.parsedData.education,
              institution: '',
              startDate: '',
              endDate: '',
            },
          ]
        : [],
      contactInformation: {
        email: cv.email,
        phone: cv.phoneNumber,
        location: null,
        portfolioUrl: null,
        whatsappNumber: cv.whatsappNumber,
      },
      skills,
      coverLetter: cv.coverLetter,

      aiMatching: cv.aiMatching,
    };

    sendSuccess(res, 200, 'CV fetched successfully', candidateProfile);
  }
);

// Download CV file
export const downloadCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findById(id);
    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    const fileStream = streamFileFromGridFS(cv.fileId);

    const contentType = cv.mimeType || 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${cv.fileName}"`,
    });

    fileStream.pipe(res);
  }
);

// Reprocess CV
export const reprocessCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findById(id);
    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    // Download file from GridFS
    const fileBuffer = await downloadFileFromGridFS(cv.fileId);

    // Get mime type from file name
    let mimeType = 'application/pdf';
    if (cv.fileName.endsWith('.docx')) {
      mimeType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Reset status to pending
    await CV.findByIdAndUpdate(id, {
      status: 'pending',
    });

    // Process CV asynchronously
    processCV(cv._id, fileBuffer, mimeType, cv.jobId)
      .then(() => {
        console.log(`✅ CV ${cv._id} reprocessed successfully`);
      })
      .catch((error) => {
        console.error(`❌ Error reprocessing CV ${cv._id}:`, error);
      });

    sendSuccess(res, 200, 'CV reprocessing started');
  }
);

// Reject candidate - set status to rejected
export const rejectCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    sendSuccess(res, 200, 'Candidate rejected successfully', {
      candidate: { id: cv._id, status: 'Rejected' },
    });
  }
);

// Accept candidate - set status to processed
export const acceptCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findByIdAndUpdate(
      id,
      { status: 'processed' },
      { new: true }
    );

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    sendSuccess(res, 200, 'Candidate accepted successfully', {
      candidate: { id: cv._id, status: 'Accepted' },
    });
  }
);

// Delete CV
export const deleteCV = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const cv = await CV.findById(id);
    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    // Delete file from GridFS
    await deleteFileFromGridFS(cv.fileId);

    // Delete CV record
    await CV.findByIdAndDelete(id);

    sendSuccess(res, 200, 'CV deleted successfully');
  }
);
