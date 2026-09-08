import { z } from "zod";

const phoneValidator = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number (e.g. +919876543210 or 9876543210)")
  .optional()
  .or(z.literal(""));

const pincodeValidator = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits (e.g. 411018)")
  .optional()
  .or(z.literal(""));

export const updateFarmerProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").max(100).optional(),
  phone: phoneValidator,
  dob: z.string().max(50, "DOB cannot exceed 50 characters").optional().or(z.literal("")),
  address: z.string().max(500, "Address cannot exceed 500 characters").optional().or(z.literal("")),
  idType: z.enum(["AADHAAR", "PAN", "DRIVING_LICENSE"]).optional(),
  idNumber: z.string().min(4, "ID Number must be at least 4 characters").max(50).optional().or(z.literal("")),
  avatarUrl: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  addressLine1: z.string().max(255, "Address Line 1 cannot exceed 255 characters").optional(),
  addressLine2: z.string().max(255, "Address Line 2 cannot exceed 255 characters").optional(),
  village: z.string().max(100, "Village cannot exceed 100 characters").optional(),
  taluka: z.string().max(100, "Taluka cannot exceed 100 characters").optional(),
  district: z.string().max(100, "District cannot exceed 100 characters").optional(),
  state: z.string().max(100, "State cannot exceed 100 characters").optional(),
  pincode: pincodeValidator,
  landSizeAcres: z
    .number()
    .min(0, "Land size must be positive")
    .max(10000, "Land size cannot exceed 10,000 acres")
    .optional()
    .nullable(),
  mainCrops: z
    .array(z.string().min(1).max(50))
    .max(20, "Cannot specify more than 20 main crops")
    .optional(),
  secondaryCrops: z
    .array(z.string().min(1).max(50))
    .max(20, "Cannot specify more than 20 secondary crops")
    .optional(),
  irrigationType: z.string().max(100, "Irrigation type cannot exceed 100 characters").optional(),
  farmLocation: z.string().max(255, "Farm location cannot exceed 255 characters").optional(),
});

export const createFarmerBookingSchema = z.object({
  mandiProfileId: z.string().min(1, "Mandi ID is required"),
  slotId: z.string().min(1, "Slot ID is required"),
  crop: z.string().optional(),
  variety: z.string().max(100).optional(),
  quantityQuintals: z.number().nonnegative().optional(),
  quantityKg: z.number().positive("Quantity must be greater than 0").optional(),
  cropsList: z
    .array(
      z.object({
        crop: z.string().min(1),
        quantityKg: z.number().positive("Quantity in KG must be greater than 0"),
        ratePerKg: z.number().nonnegative().optional(),
        estimatedAmount: z.number().nonnegative().optional(),
      })
    )
    .optional(),
  vehicleNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

