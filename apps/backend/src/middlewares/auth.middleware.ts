import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { DecodedToken, MandiProfileDto } from "../interfaces/index.js";
import { prisma } from "../lib/prisma.js";
import { Role, MandiApprovalStatus } from "@prisma/client";

// Extend Express Request interface to include user and Mandi context
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken & { id: string };
      mandiProfile?: MandiProfileDto | null;
      mandiApprovalStatus?: MandiApprovalStatus;
    }
  }
}

/**
 * Middleware to authenticate requests via Bearer JWT access token.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid Bearer token.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token missing.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token. Please refresh your token or login again.",
      code: "TOKEN_EXPIRED_OR_INVALID",
    });
    return;
  }

  // Attach decoded user payload to request
  req.user = {
    ...decoded,
    id: decoded.userId,
  };

  next();
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Must be used after authenticate middleware.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`,
        code: "FORBIDDEN_ROLE",
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to ensure the authenticated user's account is verified.
 */
export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      message: "Account verification required to access this resource.",
      code: "ACCOUNT_NOT_VERIFIED",
    });
    return;
  }

  next();
}

/**
 * Middleware to enforce that the authenticated Mandi has been approved by an Admin.
 * Attaches req.mandiProfile and req.mandiApprovalStatus to the request.
 */
export async function requireApprovedMandi(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  try {
    const profile = await prisma.mandiProfile.findUnique({
      where: { userId: req.user.userId },
      include: { legalDocs: true },
    });

    if (!profile) {
      res.status(403).json({
        success: false,
        message: "Access restricted. Mandi profile not yet initialized. Please complete onboarding.",
        code: "MANDI_NOT_APPROVED",
        data: {
          approvalStatus: MandiApprovalStatus.PENDING_ONBOARDING,
          requiresOnboarding: true,
        },
      });
      return;
    }

    req.mandiProfile = profile;
    req.mandiApprovalStatus = profile.approvalStatus;

    if (profile.approvalStatus !== MandiApprovalStatus.APPROVED) {
      if (process.env.NODE_ENV === "development") {
        await prisma.mandiProfile.update({
          where: { id: profile.id },
          data: { approvalStatus: MandiApprovalStatus.APPROVED },
        });
        profile.approvalStatus = MandiApprovalStatus.APPROVED;
      } else {
        res.status(403).json({
          success: false,
          message: `Access restricted. Your Mandi registration is currently ${profile.approvalStatus.toLowerCase().replace(/_/g, " ")}. Platform administrator approval is required.`,
          code: "MANDI_NOT_APPROVED",
          data: {
            approvalStatus: profile.approvalStatus,
            rejectionReason: profile.rejectionReason,
            requiresOnboarding: profile.approvalStatus === MandiApprovalStatus.PENDING_ONBOARDING,
          },
        });
        return;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
