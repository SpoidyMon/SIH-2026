import { Request, Response, NextFunction } from "express";
import * as mandiService from "../services/mandi.service.js";

// ----------------------------------------------------
// ONBOARDING & ADMIN APPROVAL CONTROLLERS
// ----------------------------------------------------

export async function submitOnboardingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await mandiService.submitMandiOnboarding(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Mandi onboarding application submitted successfully. Pending administrator verification.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateApprovalStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const result = await mandiService.updateMandiApprovalStatus(id, req.body);

    res.status(200).json({
      success: true,
      message: `Mandi approval status updated to ${result.approvalStatus}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminListPendingMandisHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mandis = await mandiService.listPendingMandis();

    res.status(200).json({
      success: true,
      data: { mandis },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// DASHBOARD & BOOKINGS CONTROLLERS
// ----------------------------------------------------

export async function getDashboardStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await mandiService.getMandiDashboardStats(userId);

    res.status(200).json({
      success: true,
      message: "Welcome to Mandi Operator Dashboard",
      data: {
        userId,
        role: req.user!.role,
        modules: ["Daily Rate Updates", "Arrival Management", "Auction Records", "Farmer Inquiries"],
        ...data,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const filters = req.query as any;
    const bookings = await mandiService.getCurrentBookings(userId, filters);

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPreviousBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const filters = req.query as any;
    const result = await mandiService.getPreviousBookings(userId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };
    const updated = await mandiService.updateBookingStatus(userId, id, req.body);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${updated.status}`,
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyBookingTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { token } = req.body;
    const verifiedBooking = await mandiService.verifyBookingToken(userId, token);

    res.status(200).json({
      success: true,
      message: "Gate entry authorized and verified successfully.",
      data: { booking: verifiedBooking },
    });
  } catch (error) {
    next(error);
  }
}

export async function completeBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };
    const completed = await mandiService.completeBooking(userId, id, req.body);

    res.status(200).json({
      success: true,
      message: "Weighbridge weighing and transaction completed.",
      data: { booking: completed },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// SLOTS CONTROLLERS
// ----------------------------------------------------

export async function createSlotHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const slot = await mandiService.createMandiSlot(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Mandi arrival slot created successfully.",
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSlotsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const filters = req.query as any;
    const slots = await mandiService.getMandiSlots(userId, filters);

    res.status(200).json({
      success: true,
      data: { slots },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSlotByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };
    const slot = await mandiService.getMandiSlotById(userId, id);

    res.status(200).json({
      success: true,
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSlotHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };
    const updated = await mandiService.updateMandiSlot(userId, id, req.body);

    res.status(200).json({
      success: true,
      message: "Slot updated successfully.",
      data: { slot: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSlotHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };
    const result = await mandiService.deleteMandiSlot(userId, id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function applyDefaultSlotsPresetHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const createdSlots = await mandiService.applyDefaultSlotsPreset(userId);

    res.status(201).json({
      success: true,
      message: `${createdSlots.length} default slots created for upcoming trading session.`,
      data: { slots: createdSlots },
    });
  } catch (error) {
    next(error);
  }
}

export async function batchCreateSlotsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { slots, closedDays, closedHours, operatingHours } = req.body;
    const createdSlots = await mandiService.batchCreateMandiSlots(userId, {
      slots: slots || [],
      closedDays,
      closedHours,
      operatingHours,
    });

    res.status(201).json({
      success: true,
      message: `${createdSlots.length} arrival slots generated and availability schedule saved.`,
      data: { slots: createdSlots },
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// SETTINGS & KYC CONTROLLERS
// ----------------------------------------------------

export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await mandiService.getMandiProfileDetails(userId);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await mandiService.updateMandiProfileDetails(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Mandi Profile updated successfully.",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAadhaarKycHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await mandiService.updateAadhaarKyc(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Aadhaar KYC verified successfully.",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadLegalDocHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const document = await mandiService.uploadLegalDocument(userId, req.body);

    res.status(201).json({
      success: true,
      message: "Legal compliance document uploaded.",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLegalDocHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { docId } = req.params as { docId: string };
    const result = await mandiService.deleteLegalDocument(userId, docId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRatingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const rating = await mandiService.getMandiRatingMetrics(userId);

    res.status(200).json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await mandiService.updateMandiLocation(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Physical yard location coordinates updated. Mandi is now active on the farmer app.",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmerDetailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { farmerId } = req.params as { farmerId: string };
    const details = await mandiService.getFarmerDetailsForMandi(userId, farmerId);

    res.status(200).json({
      success: true,
      data: { farmer: details },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMandiFarmersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const farmers = await mandiService.getFarmersForMandi(userId);

    res.status(200).json({
      success: true,
      data: { farmers },
    });
  } catch (error) {
    next(error);
  }
}

export async function closeMandiDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await mandiService.closeMandiDate(userId, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


