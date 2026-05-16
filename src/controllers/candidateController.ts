import { Response } from "express";
import { CV } from "../models";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../types";
import { NotFoundError } from "../utils/errors";

export const getAllCandidates = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const cvs = await CV.find()
      .populate("candidateId", "firstName lastName")
      .populate("jobId", "title")
      .sort({ uploadedAt: -1 });

    const candidates = cvs.map((cv: any) => ({
      id: cv._id,

      name:
        cv.candidateId
          ? `${cv.candidateId.firstName} ${cv.candidateId.lastName}`
          : cv.fullName || "Unknown",

      job:
        cv.jobId?.title || "Unknown",

      status: cv.status,

      cvScore: cv.matchingScore || 0,

      appliedOn: new Date(cv.uploadedAt).toLocaleDateString(),

      experience: cv.parsedData?.experience || 0,

      skills: [
        ...(cv.parsedData?.extractedSkills?.technical || []),
        ...(cv.parsedData?.extractedSkills?.soft || []),
      ],
    }));

    sendSuccess(
      res,
      200,
      "Candidates fetched successfully",
      candidates
    );
  }
);

export const getCandidateById = asyncHandler(
  async (req: AuthRequest, res: Response) =>{
    const { id } = req.params;

    const cv = await CV.findById(id)
      .populate("candidateId", "firstName lastName email")
      .populate("jobId", "title");

    if (!cv) {
    throw new NotFoundError("Candidate not found");
    }

    const candidate: any = {
      id: cv._id,

      name: cv.candidateId
        ? `${(cv.candidateId as any).firstName} ${(cv.candidateId as any).lastName}`
        : cv.fullName || "Unknown",

      email: (cv.candidateId as any)?.email || "",

      job: (cv.jobId as any)?.title || "",

      status: cv.status,

      cvScore: cv.matchingScore || 0,

      appliedOn: new Date(cv.uploadedAt).toLocaleDateString(),

      skills: [
        ...(cv.parsedData?.extractedSkills?.technical || []),
        ...(cv.parsedData?.extractedSkills?.soft || []),
      ],

      education: cv.parsedData?.education || [],

      experience: cv.parsedData?.experience || [],

      cvUrl: `${process.env.BASE_URL}/api/cvs/${cv._id}/download`,
    };

    sendSuccess(
      res,
      200,
      "Candidate fetched successfully",
      candidate
    );
  }
);