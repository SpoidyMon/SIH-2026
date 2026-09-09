import { Router } from "express";
import { authenticate, requireRole, requireApprovedMandi } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { Role } from "@prisma/client";
import * as mandiController from "../controllers/mandi.controller.js";
import { listApprovedMandisHandler, listCommoditiesHandler } from "../controllers/farmer.controller.js";
import * as mandiSchema from "../schemas/mandi.schema.js";

const router: Router = Router();

// Publicly accessible list of approved mandis & commodities
router.get("/list", listApprovedMandisHandler);
router.get("/commodities", listCommoditiesHandler);

// Base protection: All Mandi Operator routes require authenticated MANDI_OPERATOR
router.use(authenticate, requireRole(Role.MANDI_OPERATOR));

// ----------------------------------------------------
// ONBOARDING, PROFILE & KYC (Allowed during pending status)
// ----------------------------------------------------
router.post(
  "/onboarding",
  validate(mandiSchema.mandiOnboardingSchema),
  mandiController.submitOnboardingHandler
);

router.get("/profile", mandiController.getProfileHandler);

router.put(
  "/profile",
  validate(mandiSchema.updateMandiProfileSchema),
  mandiController.updateProfileHandler
);

router.post(
  "/location",
  validate(mandiSchema.updateMandiLocationSchema),
  mandiController.updateLocationHandler
);

router.get(
  "/farmers/:farmerId/details",
  mandiController.getFarmerDetailsHandler
);

router.get(
  "/farmers",
  mandiController.getMandiFarmersHandler
);

router.post(
  "/kyc/aadhaar",
  validate(mandiSchema.aadhaarKycSchema),
  mandiController.updateAadhaarKycHandler
);

router.post(
  "/kyc/documents",
  validate(mandiSchema.legalDocUploadSchema),
  mandiController.uploadLegalDocHandler
);

router.delete("/kyc/documents/:docId", mandiController.deleteLegalDocHandler);

router.get("/rating", mandiController.getRatingHandler);

// ----------------------------------------------------
// GLANCE DASHBOARD (Accessible to all logged-in Mandi operators)
// ----------------------------------------------------
router.get("/dashboard", mandiController.getDashboardStatsHandler);

// ----------------------------------------------------
// BOOKINGS STREAM & GATE VERIFICATION (Requires Admin Approved Mandi)
// ----------------------------------------------------
router.get(
  "/bookings/current",
  requireApprovedMandi,
  validate(mandiSchema.bookingQuerySchema, "query"),
  mandiController.getCurrentBookingsHandler
);

router.get(
  "/bookings/previous",
  requireApprovedMandi,
  validate(mandiSchema.bookingQuerySchema, "query"),
  mandiController.getPreviousBookingsHandler
);

router.patch(
  "/bookings/:id/status",
  requireApprovedMandi,
  validate(mandiSchema.updateBookingStatusSchema),
  mandiController.updateBookingStatusHandler
);

router.post(
  "/bookings/verify",
  requireApprovedMandi,
  validate(mandiSchema.verifyQrTokenSchema),
  mandiController.verifyBookingTokenHandler
);

router.patch(
  "/bookings/:id/complete",
  requireApprovedMandi,
  validate(mandiSchema.completeBookingSchema),
  mandiController.completeBookingHandler
);

// ----------------------------------------------------
// ARRIVAL SLOTS MANAGEMENT (Requires Admin Approved Mandi)
// ----------------------------------------------------
router.post(
  "/slots",
  requireApprovedMandi,
  validate(mandiSchema.createSlotSchema),
  mandiController.createSlotHandler
);

router.get(
  "/slots",
  requireApprovedMandi,
  validate(mandiSchema.slotQuerySchema, "query"),
  mandiController.getSlotsHandler
);

router.get("/slots/:id", requireApprovedMandi, mandiController.getSlotByIdHandler);

router.put(
  "/slots/:id",
  requireApprovedMandi,
  validate(mandiSchema.updateSlotSchema),
  mandiController.updateSlotHandler
);

router.delete("/slots/:id", requireApprovedMandi, mandiController.deleteSlotHandler);

router.post(
  "/slots/default-preset",
  requireApprovedMandi,
  mandiController.applyDefaultSlotsPresetHandler
);

router.post(
  "/slots/batch",
  requireApprovedMandi,
  mandiController.batchCreateSlotsHandler
);

router.post(
  "/calendar/close-date",
  requireApprovedMandi,
  validate(mandiSchema.closeMandiDateSchema),
  mandiController.closeMandiDateHandler
);

// ----------------------------------------------------
// CROP PROCUREMENT PRICING (Accessible to all logged-in Mandi operators)
// ----------------------------------------------------
router.get("/crop-prices", mandiController.getCropRatesHandler);
router.put(
  "/crop-prices",
  validate(mandiSchema.updateCropRatesSchema),
  mandiController.updateCropRatesHandler
);

export default router;


