import { Router } from "express";
import { getAllCandidates, getCandidateById } from "../controllers/candidateController";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("hr"),
  getAllCandidates
);

router.get(
  "/:id",
  authenticate,
  authorize("hr"),
  getCandidateById
);

export default router;