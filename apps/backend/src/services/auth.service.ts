import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from "../utils/jwt.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import {
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
} from "./email.service.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import { Role, OtpType, MandiApprovalStatus } from "@prisma/client";
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  CompleteMandiOnboardingInput,
} from "../schemas/auth.schema.js";

/**
 * Registers a new user account (Farmer or Mandi Operator).
 * Gracefully handles unverified re-registrations by updating credentials and issuing a fresh OTP.
 */
export async function registerUser(data: RegisterInput) {
  const normalizedEmail = data.email.toLowerCase().trim();

  // 1. Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  let user;
  const passwordHash = await hashPassword(data.password);

  if (existingEmail) {
    // If account is already verified, reject with 409
    if (existingEmail.isVerified !== false) {
      throw new AppError(
        "An account with this email address already exists.",
        409,
        "EMAIL_EXISTS"
      );
    }

    // Existing unverified account: update credentials and resend verification OTP
    user = await prisma.user.update({
      where: { id: existingEmail.id },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || existingEmail.phone,
        passwordHash,
        role: data.role,
      },
    });

    // Invalidate old unconsumed OTPs for this user
    await prisma.otpVerification.updateMany({
      where: {
        identifier: normalizedEmail,
        type: OtpType.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });
  } else {
    // 2. Check if phone already exists
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone.trim() },
      });

      if (existingPhone && existingPhone.isVerified !== false) {
        throw new AppError(
          "An account with this phone number already exists.",
          409,
          "PHONE_EXISTS"
        );
      }
    }

    // 3. Create user record in database
    user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        passwordHash,
        role: data.role,
        isVerified: false,
      },
    });
  }

  // If registering as Mandi Operator, pre-create the MandiProfile with the provided mandiName
  if (data.role === Role.MANDI_OPERATOR) {
    const customMandiName = data.mandiName?.trim() || `${user.name}'s APMC Yard`;
    const mandiCodeCount = (await prisma.mandiProfile?.count?.()) ?? 0;
    const mandiCode = `MAN${String(mandiCodeCount + 1).padStart(3, "0")}`;

    if (prisma.mandiProfile?.upsert) {
      await prisma.mandiProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          mandiName: customMandiName,
          mandiCode,
          operatingHours: "08:00 AM - 06:00 PM (Mon-Sat)",
          approvalStatus: MandiApprovalStatus.PENDING_ONBOARDING,
          isLocationSet: false,
        },
        update: {
          mandiName: customMandiName,
        },
      });
    }
  }

  // 4. Generate and dispatch verification OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpVerification.create({
    data: {
      identifier: normalizedEmail,
      userId: user.id,
      codeHash: otpHash,
      type: OtpType.EMAIL_VERIFICATION,
      expiresAt,
    },
  });

  // Dispatch verification email in background
  sendVerificationOtpEmail(normalizedEmail, user.name, otp).catch((err) => {
    console.error("Failed to send verification email:", err);
  });

  // For FARMER role, issue initial tokens upon registration
  let accessToken: string | undefined;
  let refreshTokenRaw: string | undefined;

  if (user.role === Role.FARMER) {
    accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });

    refreshTokenRaw = generateRefreshTokenString();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken: refreshTokenRaw,
    message: existingEmail
      ? "Account exists but is unverified. A fresh OTP code has been dispatched to your email."
      : "Registration successful. Please verify your email with the OTP sent.",
  };
}

/**
 * Authenticates user credentials and issues new token pair.
 * Automatically dispatches fresh OTP if account is unverified.
 */
export async function loginUser(data: LoginInput) {
  const isEmail = data.identifier.includes("@");
  const normalizedIdentifier = isEmail ? data.identifier.toLowerCase().trim() : data.identifier.trim();

  const user = isEmail
    ? await prisma.user.findUnique({
        where: { email: normalizedIdentifier },
      })
    : await prisma.user.findUnique({
        where: { phone: normalizedIdentifier },
      });

  if (!user) {
    throw new AppError(
      isEmail
        ? "No account found with this email address."
        : "No account found with this phone number.",
      401,
      "USER_NOT_FOUND"
    );
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(
      "Your password is incorrect.",
      401,
      "INCORRECT_PASSWORD"
    );
  }

  // Ensure account is verified before issuing session tokens
  if (!user.isVerified) {
    // Generate and dispatch a fresh OTP immediately
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpVerification.updateMany({
      where: {
        identifier: user.email,
        type: OtpType.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    await prisma.otpVerification.create({
      data: {
        identifier: user.email,
        userId: user.id,
        codeHash: otpHash,
        type: OtpType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    sendVerificationOtpEmail(user.email, user.name, otp).catch((err) => {
      console.error("Failed to send verification email on unverified login attempt:", err);
    });

    throw new AppError(
      "Your account is not verified. A fresh OTP has been sent to your email. Please verify to continue.",
      403,
      "ACCOUNT_NOT_VERIFIED"
    );
  }

  // If Mandi Operator account hasn't completed onboarding, prompt to finish setup
  if (user.role === Role.MANDI_OPERATOR) {
    const mandiProfile = await prisma.mandiProfile.findUnique({
      where: { userId: user.id },
    });
    if (
      mandiProfile &&
      (!mandiProfile.isLocationSet ||
        mandiProfile.approvalStatus === MandiApprovalStatus.PENDING_ONBOARDING)
    ) {
      throw new AppError(
        "Your Mandi registration is incomplete. Please finish location & operating slots setup.",
        403,
        "ONBOARDING_INCOMPLETE"
      );
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  });

  const refreshTokenRaw = generateRefreshTokenString();
  const refreshTokenHash = hashToken(refreshTokenRaw);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken: refreshTokenRaw,
  };
}

/**
 * Refreshes an access token with rotation and reuse detection.
 */
export async function refreshAccessToken(refreshTokenRaw: string) {
  const tokenHash = hashToken(refreshTokenRaw);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token.", 401, "INVALID_REFRESH_TOKEN");
  }

  // Reuse detection: Invalidate all sessions if token was already revoked
  if (storedToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revokedAt: new Date() },
    });
    throw new AppError(
      "Refresh token has already been used. All active sessions invalidated for security.",
      401,
      "TOKEN_REUSE_DETECTED"
    );
  }

  // Check expiration
  if (storedToken.expiresAt < new Date()) {
    throw new AppError(
      "Refresh token has expired. Please log in again.",
      401,
      "REFRESH_TOKEN_EXPIRED"
    );
  }

  // Issue new token pair
  const user = storedToken.user;
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  });

  const newRefreshTokenRaw = generateRefreshTokenString();
  const newRefreshTokenHash = hashToken(newRefreshTokenRaw);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Atomically rotate tokens
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newRefreshTokenHash,
      },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenRaw,
  };
}

/**
 * Revokes refresh token to log out user.
 */
export async function logoutUser(refreshTokenRaw?: string) {
  if (refreshTokenRaw) {
    const tokenHash = hashToken(refreshTokenRaw);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  return { success: true, message: "Logged out successfully." };
}

/**
 * Dispatches an OTP code for verification or password recovery.
 */
export async function sendOtp(identifier: string, type: OtpType) {
  const isEmail = identifier.includes("@");
  const cleanId = isEmail ? identifier.toLowerCase().trim() : identifier.trim();

  const user = isEmail
    ? await prisma.user.findUnique({
        where: { email: cleanId },
      })
    : await prisma.user.findUnique({
        where: { phone: cleanId },
      });

  // Invalidate previous unconsumed OTPs
  await prisma.otpVerification.updateMany({
    where: {
      identifier: cleanId,
      type,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpVerification.create({
    data: {
      identifier: cleanId,
      userId: user?.id || null,
      codeHash: otpHash,
      type,
      expiresAt,
    },
  });

  if (isEmail && user) {
    if (type === OtpType.EMAIL_VERIFICATION || type === OtpType.LOGIN_OTP) {
      await sendVerificationOtpEmail(user.email, user.name, otp);
    } else if (type === OtpType.PASSWORD_RESET) {
      await sendPasswordResetEmail(user.email, user.name, otp, otp);
    }
  }

  return {
    success: true,
    message: `OTP sent successfully to ${identifier}. Valid for 10 minutes.`,
  };
}

/**
 * Validates and consumes OTP code, marks account verified, and returns active session.
 */
export async function verifyOtp(
  identifier: string,
  code: string,
  type: OtpType
) {
  const isEmail = identifier.includes("@");
  const cleanId = isEmail ? identifier.toLowerCase().trim() : identifier.trim();
  const codeHash = hashOtp(code.trim());

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      identifier: cleanId,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("Invalid or expired OTP code.", 400, "INVALID_OTP");
  }

  // Mark OTP as consumed
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { consumedAt: new Date() },
  });

  // Mark user as verified
  if (isEmail) {
    await prisma.user.updateMany({
      where: { email: cleanId },
      data: { isVerified: true },
    });
  } else {
    await prisma.user.updateMany({
      where: { phone: cleanId },
      data: { isVerified: true },
    });
  }

  // Fetch full user record to issue active session tokens
  let user = null;
  if (otpRecord.userId) {
    user = await prisma.user.findUnique({
      where: { id: otpRecord.userId },
    });
  } else {
    user = isEmail
      ? await prisma.user.findUnique({ where: { email: cleanId } })
      : await prisma.user.findUnique({ where: { phone: cleanId } });
  }

  if (user) {
    // If Mandi Operator is in pending onboarding state, do NOT issue active session tokens yet
    if (user.role === Role.MANDI_OPERATOR) {
      const mandiProfile = await prisma.mandiProfile.findUnique({
        where: { userId: user.id },
      });
      if (
        !mandiProfile ||
        !mandiProfile.isLocationSet ||
        mandiProfile.approvalStatus === MandiApprovalStatus.PENDING_ONBOARDING
      ) {
        return {
          isVerified: true,
          isOnboarding: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: true,
            createdAt: user.createdAt,
          },
          message: "Email verified successfully. Please proceed with Mandi location setup.",
        };
      }
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isVerified: true,
    });

    const refreshTokenRaw = generateRefreshTokenString();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      isVerified: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: true,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken: refreshTokenRaw,
      message: "Account verified successfully.",
    };
  }

  return {
    isVerified: true,
    message: "Account verified successfully.",
  };
}

/**
 * Initiates forgot password flow by generating token and OTP.
 */
export async function forgotPassword(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    // Return success to prevent email enumeration
    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched.",
    };
  }

  const resetTokenRaw = generateRefreshTokenString();
  const resetTokenHash = hashToken(resetTokenRaw);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: resetTokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await prisma.otpVerification.create({
    data: {
      identifier: cleanEmail,
      userId: user.id,
      codeHash: otpHash,
      type: OtpType.PASSWORD_RESET,
      expiresAt,
    },
  });

  sendPasswordResetEmail(user.email, user.name, resetTokenRaw, otp).catch((err) => {
    console.error("Failed to send password reset email:", err);
  });

  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been dispatched.",
  };
}

/**
 * Resets user password using reset token or OTP code.
 */
export async function resetPassword(data: ResetPasswordInput) {
  const cleanEmail = data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset request.", 400, "INVALID_RESET_REQUEST");
  }

  let isValid = false;

  // Try token hash first
  const tokenHash = hashToken(data.token);
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (resetRecord) {
    isValid = true;
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });
  } else {
    // Try 6-digit OTP
    const otpHash = hashOtp(data.token);
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanEmail,
        codeHash: otpHash,
        type: OtpType.PASSWORD_RESET,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (otpRecord) {
      isValid = true;
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      });
    }
  }

  if (!isValid) {
    throw new AppError("Invalid or expired reset token/OTP.", 400, "INVALID_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isVerified: true },
  });

  // Invalidate all active sessions for security
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return {
    success: true,
    message: "Password has been reset successfully. You may now log in.",
  };
}

/**
 * Fetches user profile for authenticated session.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
}

/**
 * Completes post-verification onboarding for Mandi Operator (Location + Slots),
 * updates MandiProfile, creates initial slots, and issues official session tokens.
 */
export async function completeMandiOnboarding(data: CompleteMandiOnboardingInput) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { mandiProfile: true },
  });

  if (!user) {
    throw new AppError("No account found with this email address.", 404, "USER_NOT_FOUND");
  }

  if (user.role !== Role.MANDI_OPERATOR) {
    throw new AppError("User account is not a Mandi Operator.", 403, "INVALID_ROLE");
  }

  if (!user.isVerified) {
    throw new AppError("Email address has not been verified yet. Please verify OTP first.", 403, "EMAIL_NOT_VERIFIED");
  }

  const mandiCodeCount = (await prisma.mandiProfile?.count?.()) ?? 0;
  const mandiCode = user.mandiProfile?.mandiCode || `MAN${String(mandiCodeCount + 1).padStart(3, "0")}`;

  // Update Mandi Profile
  const mandiProfile = await prisma.mandiProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      mandiCode,
      mandiName: user.mandiProfile?.mandiName || `${user.name}'s APMC Yard`,
      address: data.address.trim(),
      pincode: data.pincode.trim(),
      district: data.district?.trim() || null,
      state: data.state?.trim() || null,
      latitude: data.latitude,
      longitude: data.longitude,
      operatingHours: data.operatingHours || "08:00 AM - 06:00 PM (Mon-Sat)",
      closedDays: data.closedDays || [],
      closedHours: data.closedHours || null,
      isLocationSet: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
    },
    update: {
      address: data.address.trim(),
      pincode: data.pincode.trim(),
      district: data.district?.trim() || null,
      state: data.state?.trim() || null,
      latitude: data.latitude,
      longitude: data.longitude,
      operatingHours: data.operatingHours || "08:00 AM - 06:00 PM (Mon-Sat)",
      closedDays: data.closedDays || [],
      closedHours: data.closedHours || null,
      isLocationSet: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
    },
  });

  // Create initial arrival slots if provided
  if (data.slots && data.slots.length > 0) {
    for (const slot of data.slots) {
      const maxFarmers = slot.maxFarmers || 10;
      const totalCapacityKg = (slot.totalCapacityQuintals || 500) * 100;
      await prisma.mandiSlot.create({
        data: {
          mandiProfileId: mandiProfile.id,
          crop: slot.crop || "Wheat, Mustard, Soybean",
          allowedCrops: slot.allowedCrops || [
            { crop: "Wheat", isFixed: false },
            { crop: "Mustard", isFixed: false },
            { crop: "Soybean", isFixed: false },
          ],
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          totalCapacityQuintals: slot.totalCapacityQuintals,
          totalCapacityKg,
          bookedCapacityQuintals: 0,
          bookedCapacityKg: 0,
          capacityPercentage: 0,
          maxFarmers,
          bookedFarmers: 0,
          availableBookings: maxFarmers,
          bufferMinutes: slot.bufferMinutes ?? 15,
          bufferPercentage: slot.bufferPercentage ?? 10,
          isActive: true,
        },
      });
    }
  }

  // Issue active session tokens now that onboarding is complete
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    isVerified: true,
  });

  const refreshTokenRaw = generateRefreshTokenString();
  const refreshTokenHash = hashToken(refreshTokenRaw);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: true,
      createdAt: user.createdAt,
    },
    mandiProfile,
    accessToken,
    refreshToken: refreshTokenRaw,
    message: "Mandi onboarding completed successfully.",
  };
}

