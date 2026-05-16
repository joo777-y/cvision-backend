import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export const checkHRApproval = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  if (
    req.user?.role === "hr" &&
    !req.user?.isApproved
  ) {
    res.status(403).json({
      success: false,
      message: "Your account is pending approval",
    });

    return;
  }

  next();
};