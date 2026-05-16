import { Response } from 'express';
import { User, Job, CV } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

// Map CV status to Figma display (Pending, Accepted, Rejected)
const cvStatusToDisplay = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'Pending',
    processed: 'Accepted',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

// Get dashboard statistics - Figma HR Dashboard format
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const userId = new mongoose.Types.ObjectId(req.user?.userId);

    // هات الوظايف الخاصة بالـ HR الحالي فقط
    const hrJobs = await Job.find({
      createdBy: userId,
    }).lean();

    const jobIds = hrJobs.map((job) => job._id);


    const totalActiveJobs = await Job.countDocuments({
      createdBy: userId,
      status: 'active',
    });

    const totalApplications = await CV.countDocuments({
      jobId: { $in: jobIds },
    });

   const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const newApplications = await CV.countDocuments({
        jobId: { $in: jobIds },
        uploadedAt: { $gte: threeDaysAgo },
      }); 

    const rejected = await CV.countDocuments({
      jobId: { $in: jobIds },
      status: 'rejected',
    });

    const uniqueApplicantsResult = await CV.aggregate([
      {
        $match: {
          jobId: { $in: jobIds },
        },
      },
      {
        $group: {
          _id: '$candidateId',
        },
      },
      {
        $count: 'total',
      },
    ]);

    const totalApplicants =
      uniqueApplicantsResult.length > 0
        ? uniqueApplicantsResult[0].total
        : 0;

    // الوظايف الخاصة بالـ HR الحالي فقط
    const jobsWithCounts = await Job.aggregate([
      {
        $match: {
          createdBy: userId,
          status: { $in: ['active', 'draft'] },
        },
      },
      {
        $lookup: {
          from: 'cvs',
          localField: '_id',
          foreignField: 'jobId',
          as: 'cvs',
        },
      },
      {
        $project: {
          id: '$_id',
          title: 1,
          jobType: 1,
          department: 1,
          location: 1,
          applicationsCount: { $size: '$cvs' },
          status: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // recent applications الخاصة بوظايف الـ HR فقط
    const recentCVs = await CV.find({
      jobId: { $in: jobIds },
    })
      .populate('candidateId', 'firstName lastName email')
      .populate('jobId', 'title')
      .sort({ uploadedAt: -1 })
      .limit(10)
      .lean();

    const recentApplications = recentCVs.map((cv: any) => ({
      id: cv._id,
      applicantName:
        cv.fullName ||
        (
          cv.candidateId && typeof cv.candidateId === "object"
            ? `${(cv.candidateId as any).firstName || ""} ${(cv.candidateId as any).lastName || ""}`.trim()
            : "Unknown"
        ),

      jobTitle:
        cv.jobId && typeof cv.jobId === 'object'
          ? (cv.jobId as any).title
          : 'Unknown',

      status: cvStatusToDisplay(cv.status),
      appliedOn: new Date(cv.uploadedAt).toLocaleDateString("en-GB"),
    }));

    const stats = {
      totalActiveJobs,
      totalApplicants,
      totalApplications,
      newApplications,
      rejected,
      jobs: jobsWithCounts,
      recentApplications,
    };

    sendSuccess(
      res,
      200,
      'Dashboard stats fetched successfully',
      stats
    );
  }
);

// Get recent activities
export const getRecentActivities = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent users
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent jobs
    const recentJobs = await Job.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent CVs
    const recentCVs = await CV.find()
      .populate('candidateId', 'firstName lastName email')
      .populate('jobId', 'title')
      .sort({ uploadedAt: -1 })
      .limit(limit);

    // Combine and sort all activities
    const activities: any[] = [];

    recentUsers.forEach((user) => {
      activities.push({
        type: 'user_registered',
        timestamp: user.createdAt,
        data: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        },
      });
    });

    recentJobs.forEach((job) => {
      activities.push({
        type: 'job_created',
        timestamp: job.createdAt,
        data: {
          title: job.title,
          createdBy:
            job.createdBy && typeof job.createdBy === 'object'
              ? `${(job.createdBy as any).firstName} ${(job.createdBy as any).lastName}`
              : 'Unknown',
        },
      });
    });

    recentCVs.forEach((cv) => {
      activities.push({
        type: 'cv_uploaded',
        timestamp: cv.uploadedAt,
        data: {
          candidateName:
            cv.candidateId && typeof cv.candidateId === 'object'
              ? `${(cv.candidateId as any).firstName} ${(cv.candidateId as any).lastName}`
              : 'Unknown',
          jobTitle:
            cv.jobId && typeof cv.jobId === 'object'
              ? (cv.jobId as any).title
              : 'Unknown',
          fileName: cv.fileName,
          status: cv.status,
          matchingScore: cv.matchingScore,
        },
      });
    });

    // Sort by timestamp descending
    activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    sendSuccess(
      res,
      200,
      'Recent activities fetched successfully',
      activities.slice(0, limit)
    );
  }
);
