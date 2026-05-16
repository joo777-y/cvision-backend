import { Response } from 'express';
import { Job, CV } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { AuthRequest } from '../types';

// Create new job - maps jobTitle/jobDescription (Figma) to title/description
export const createJob = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const body = req.body;

    const jobData: Record<string, any> = {
      title: body.title || body.jobTitle,
      description: body.description || body.jobDescription,
      requirements: body.requirements,
      responsibilities: body.responsibilities,
      location: body.location,
      jobType: body.jobType,
      department: body.department,
      salaryRange: body.salaryRange,
      status: body.status || 'draft',
      createdBy: userId,
    };

    // Optional scoring fields and Figma fields
    if (body.requiredSkills) {
      jobData.requiredSkills = body.requiredSkills;
    }
    const experience =
      body.requiredExperience ?? body.experience;
    if (experience !== undefined) {
      jobData.requiredExperience = Number(experience);
    }
    if (body.requiredEducation) {
      jobData.requiredEducation = body.requiredEducation;
    }
    if (body.benefits !== undefined) {
      jobData.benefits = body.benefits;
    }

    const job = await Job.create(jobData);

    sendSuccess(res, 201, 'Job created successfully', {
      job: formatJobResponse(job, 0),
    });
  }
);

// Format job for Figma response
const formatJobResponse = (job: any, applicationsCount: number) => ({
  id: job._id,
  title: job.title,
  companyName:
    job.createdBy?.companyName ||
    (job.createdBy && typeof job.createdBy === 'object'
      ? `${(job.createdBy as any).firstName || ''} ${(job.createdBy as any).lastName || ''}`.trim()
      : null),
  location: job.location,
  jobType: job.jobType,
  postedDate: job.createdAt,
  applicationsCount,
  status: job.status,
  description: job.description,
  requirements: job.requirements,
  responsibilities: job.responsibilities,
  department: job.department,
  salaryRange: job.salaryRange,
  benefits: job.benefits,
  experience: job.requiredExperience,
});

// Get all jobs with pagination and filters - Figma: search, location, jobType, department, minSalary, maxSalary
export const getJobs = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const location = req.query.location as string;
    const jobType = req.query.jobType as string;
    const department = req.query.department as string;
    const minSalary = parseFloat(req.query.minSalary as string);
    const maxSalary = parseFloat(req.query.maxSalary as string);

    const query: Record<string, unknown> = {};
    const userId = req.user?.userId;

    if (userId) {
    query.createdBy = userId;
  }
    if (status) query.status = status;
    if (location) query.location = new RegExp(location, 'i');
    if (jobType) query.jobType = jobType;
    if (department) query.department = new RegExp(department, 'i');
    if (!isNaN(minSalary) && minSalary > 0) {
      (query as any)['salaryRange.min'] = { $gte: minSalary };
    }
    if (!isNaN(maxSalary) && maxSalary > 0) {
      (query as any)['salaryRange.max'] = { $lte: maxSalary };
    }
    if (search?.trim()) {
      query.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('createdBy', 'firstName lastName email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
    ]);

    // Get applicationsCount per job
    const jobIds = jobs.map((j: any) => j._id);
    const cvCounts = await CV.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      cvCounts.map((c: any) => [c._id.toString(), c.count])
    );

    const formattedJobs = jobs.map((job: any) =>
      formatJobResponse(
        { ...job, createdBy: job.createdBy },
        countMap.get(job._id.toString()) || 0
      )
    );

    sendSuccess(res, 200, 'Jobs fetched successfully', {
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

export const getMyJobs = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const query = {
      createdBy: req.user?.userId,
    };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('createdBy', 'firstName lastName email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Job.countDocuments(query),
    ]);

    // applications count
    const jobIds = jobs.map((j: any) => j._id);

    const cvCounts = await CV.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      cvCounts.map((c: any) => [c._id.toString(), c.count])
    );

    const formattedJobs = jobs.map((job: any) =>
      formatJobResponse(
        { ...job, createdBy: job.createdBy },
        countMap.get(job._id.toString()) || 0
      )
    );

    sendSuccess(res, 200, 'My jobs fetched successfully', {
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// Get single job by ID
export const getJobById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const job = await Job.findById(id).populate(
      'createdBy',
      'firstName lastName email companyName'
    );

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const applicationsCount = await CV.countDocuments({ jobId: id });
    sendSuccess(res, 200, 'Job fetched successfully', {
      job: formatJobResponse(job, applicationsCount),
    });
  }
);

// Update job
export const updateJob = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const job = await Job.findById(id);

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Check authorization - only creator can update
    if (job.createdBy.toString() !== userId) {
      throw new AuthorizationError(
        'You are not authorized to update this job'
      );
    }

    const body = req.body;
    const updateData: Record<string, any> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.jobTitle !== undefined) updateData.title = body.jobTitle;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.jobDescription !== undefined)
      updateData.description = body.jobDescription;
    if (body.requirements !== undefined)
      updateData.requirements = body.requirements;
    if (body.responsibilities !== undefined)
      updateData.responsibilities = body.responsibilities;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.jobType !== undefined) updateData.jobType = body.jobType;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.salaryRange !== undefined) updateData.salaryRange = body.salaryRange;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.requiredSkills !== undefined)
      updateData.requiredSkills = body.requiredSkills;
    if (body.requiredExperience !== undefined)
      updateData.requiredExperience = body.requiredExperience;
    if (body.experience !== undefined)
      updateData.requiredExperience = Number(body.experience);
    if (body.requiredEducation !== undefined)
      updateData.requiredEducation = body.requiredEducation;
    if (body.benefits !== undefined) updateData.benefits = body.benefits;

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'firstName lastName email companyName')
      .lean();

    const applicationsCount = await CV.countDocuments({ jobId: id });
    sendSuccess(res, 200, 'Job updated successfully', {
      job: formatJobResponse(updatedJob, applicationsCount),
    });
  }
);

// Delete job
export const deleteJob = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const job = await Job.findById(id);

    if (!job) {
      throw new NotFoundError('Job not found');
    }


    // Check authorization - only creator can delete
    if (job.createdBy.toString() !== userId) {
      throw new AuthorizationError(
        'You are not authorized to delete this job'
      );
    }

    await Job.findByIdAndDelete(id);

    sendSuccess(res, 200, 'Job deleted successfully');
  }
);

// Map CV status to Figma display status
const cvStatusToFigma = (status: string) => {
  const map: Record<string, string> = {
    pending: 'NEW',
    processed: 'Accepted',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

// Map Figma status to CV status
const figmaStatusToCv = (status: string): string | null => {
  const map: Record<string, string> = {
    New: 'pending',
    NEW: 'pending',
    Accepted: 'processed',
    Rejected: 'rejected',
  };
  return map[status] || null;
};

// Get candidates for a specific job - Figma format
export const getJobCandidates = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const minScore = parseFloat(req.query.minScore as string) || 0;
    const maxScore = parseFloat(req.query.maxScore as string);
    const statusFilter = req.query.status as string;
    const search = (req.query.search as string)?.trim();
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const job = await Job.findById(id);

    if (!job) {
      throw new NotFoundError('Job not found');
    }
    if (job.createdBy.toString() !== req.user?.userId) {
    throw new AuthorizationError(
      'You are not authorized to view these candidates'
    );
  }

    const query: any = { jobId: id };
    if (minScore > 0 || (!isNaN(maxScore) && maxScore > 0)) {
      query.matchingScore = {};
      if (minScore > 0) query.matchingScore.$gte = minScore;
      if (!isNaN(maxScore) && maxScore > 0) query.matchingScore.$lte = maxScore;
    }
    const cvStatus = figmaStatusToCv(statusFilter || '');
    if (cvStatus) query.status = cvStatus;
    if (startDate) query.uploadedAt = { ...(query.uploadedAt || {}), $gte: new Date(startDate) };
    if (endDate) query.uploadedAt = { ...(query.uploadedAt || {}), $lte: new Date(endDate) };
    if (search) {
      query.$or = [
        { 'parsedData.rawText': new RegExp(search, 'i') },
        { coverLetter: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;

    const [cvs, total] = await Promise.all([
      CV.find(query)
        .populate('candidateId', 'firstName lastName email')
        .populate('jobId', 'title')
        .sort({ matchingScore: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CV.countDocuments(query),
    ]);

    const candidates = (cvs as any[]).map((cv) => {
      const candidate = cv.candidateId;
      const jobObj = cv.jobId;
      const skills = [
        ...(cv.parsedData?.extractedSkills?.technical || []),
        ...(cv.parsedData?.extractedSkills?.soft || []),
      ];
      return {
        id: cv._id,
        name:
          candidate && typeof candidate === 'object'
            ? `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim()
            : 'Unknown',
        jobTitleAppliedFor:
          jobObj && typeof jobObj === 'object' ? jobObj.title : job.title,
        location: null, // User model doesn't have location
        skills,
        status: cvStatusToFigma(cv.status),
        applicationDate: cv.uploadedAt,
        matchingScore: cv.matchingScore,
        cvUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/cvs/${cv._id}/download`,
      };
    });

    sendSuccess(res, 200, 'Candidates fetched successfully', {
      job: { id: job._id, title: job.title },
      candidates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);
