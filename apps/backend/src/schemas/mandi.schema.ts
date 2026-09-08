import { z } from "zod";
import { BookingStatus, LegalDocType, MandiApprovalStatus } from "@prisma/client";

// Onboarding & Admin Approval Schemas
export const mandiOnboardingSchema = z.object({
  mandiName: z.string().min(3, "Mandi name must be at least 3 characters").max(150),
  apmcCode: z.string().min(3, "APMC Code must be at least 3 characters").max(50),
  address: z.string().min(5, "Physical address must be provided").max(300),
  district: z.string().min(2, "District is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  operatingHours: z.string().max(100).optional().default("08:00 AM - 06:00 PM (Mon-Sat)"),
  aadhaarNumber: z
    .string()
    .regex(/^(\d{12}|\d{4}\s\d{4}\s\d{4}|•{4}\s•{4}\s\d{4})$/, "Invalid Aadhaar number format"),
  aadhaarDocUrl: z.string().optional().default("https://vault.agrimarket.gov.in/docs/aadhaar_verified.pdf"),
  legalDocs: z
    .array(
      z.object({
        name: z.string().min(2).max(150),
        type: z.nativeEnum(LegalDocType),
        fileUrl: z.string().optional(),
      })
    )
    .optional(),
});

export const adminApprovalSchema = z.object({
  status: z.nativeEnum(MandiApprovalStatus, {
    errorMap: () => ({
      message:
        "Invalid approval status. Allowed: PENDING_ONBOARDING, PENDING_APPROVAL, APPROVED, REJECTED, REQUIRES_DOCUMENTS",
    }),
  }),
  rejectionReason: z.string().max(500).optional(),
});

// Slot Schemas
export const createSlotSchema = z.object({
  crop: z.string().min(2, "Crop name must be at least 2 characters").max(100),
  allowedCrops: z
    .array(
      z.object({
        crop: z.string().min(1),
        quantityKg: z.number().nonnegative().optional(),
        quantityQuintals: z.number().nonnegative().optional(),
        ratePerKg: z.number().nonnegative().optional(),
        instructions: z.string().optional(),
        isFixed: z.boolean().optional(),
      })
    )
    .optional(),
  instructions: z.string().max(1000).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format (24h)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format (24h)"),
  totalCapacityQuintals: z
    .number()
    .positive("Total capacity must be greater than 0")
    .optional(),
  totalCapacityKg: z.number().positive().optional(),
  maxFarmers: z
    .number({ invalid_type_error: "Max farmers must be an integer" })
    .int()
    .positive("Max farmers must be at least 1"),
  bufferMinutes: z
    .number()
    .int()
    .min(0, "Buffer minutes cannot be negative")
    .max(180, "Buffer minutes cannot exceed 180")
    .optional()
    .default(15),
  bufferPercentage: z
    .number()
    .min(0, "Buffer percentage cannot be negative")
    .max(100, "Buffer percentage cannot exceed 100")
    .optional()
    .default(10),
});

export const updateSlotSchema = z.object({
  crop: z.string().min(2).max(100).optional(),
  allowedCrops: z
    .array(
      z.object({
        crop: z.string().min(1),
        quantityKg: z.number().nonnegative().optional(),
        quantityQuintals: z.number().nonnegative().optional(),
        ratePerKg: z.number().nonnegative().optional(),
        instructions: z.string().optional(),
        isFixed: z.boolean().optional(),
      })
    )
    .optional(),
  instructions: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  totalCapacityQuintals: z.number().positive().optional(),
  totalCapacityKg: z.number().positive().optional(),
  maxFarmers: z.number().int().positive().optional(),
  bufferMinutes: z.number().int().min(0).max(180).optional(),
  bufferPercentage: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const slotQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  crop: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// Booking Schemas
export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus, {
    errorMap: () => ({
      message:
        "Invalid booking status. Allowed: PENDING, ACCEPTED, REJECTED, ARRIVED, VERIFIED, COMPLETED, CANCELLED",
    }),
  }),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  rejectionReason: z.string().max(500, "Rejection reason cannot exceed 500 characters").optional(),
});

export const verifyQrTokenSchema = z.object({
  token: z.string().min(1, "QR token or Booking ID is required"),
});

export const closeMandiDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  reason: z.string().max(500, "Reason cannot exceed 500 characters").optional(),
});

export const completeBookingSchema = z.object({
  finalWeightQuintals: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const bookingQuerySchema = z.object({
  status: z.string().optional(),
  crop: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !isNaN(v) && v > 0, { message: "Page must be a positive number" })
    .optional(),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((v) => !isNaN(v) && v > 0 && v <= 100, {
      message: "Limit must be between 1 and 100",
    })
    .optional(),
});

// Profile & KYC Schemas
export const updateMandiProfileSchema = z.object({
  mandiName: z.string().min(2).max(150).optional(),
  address: z.string().max(300).optional(),
  pincode: z.string().max(20).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  operatingHours: z.string().max(100).optional(),
  closedDays: z.array(z.string()).optional(),
  closedHours: z.string().max(100).optional(),
  apmcCode: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateMandiLocationSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  pincode: z.string().min(4, "Pincode is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  district: z.string().optional(),
  state: z.string().optional(),
  operatingHours: z.string().optional(),
  closedDays: z.array(z.string()).optional(),
  closedHours: z.string().optional(),
});

export const aadhaarKycSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^(\d{12}|\d{4}\s\d{4}\s\d{4}|•{4}\s•{4}\s\d{4})$/, "Invalid Aadhaar number format"),
  aadhaarDocUrl: z.string().optional().or(z.string()),
});

export const legalDocUploadSchema = z.object({
  name: z.string().min(3).max(150),
  type: z.nativeEnum(LegalDocType, {
    errorMap: () => ({
      message:
        "Invalid document category. Allowed: MANDI_LICENSE, APMC_REGISTRATION, GST_CERTIFICATE, OTHER",
    }),
  }),
  fileUrl: z.string().optional(),
});
