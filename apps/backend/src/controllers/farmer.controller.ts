import { Request, Response, NextFunction } from "express";
import {
  getFarmerProfile,
  updateFarmerProfile,
  listApprovedMandis,
  createFarmerBooking,
  getFarmerBookings,
  listOfficialCommodities,
} from "../services/farmer.service.js";
import { updateFarmerProfileSchema } from "../schemas/farmer.schema.js";

/**
 * Controller to get current authenticated farmer profile: GET /api/v1/farmer/profile
 */
export async function getFarmerProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await getFarmerProfile(userId);

    res.status(200).json({
      success: true,
      message: "Farmer profile retrieved successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to update farmer profile and KYC identity: PUT/PATCH /api/v1/farmer/profile
 */
export async function updateFarmerProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const validatedData = updateFarmerProfileSchema.parse(req.body);
    const updatedProfile = await updateFarmerProfile(userId, validatedData);

    res.status(200).json({
      success: true,
      message: "Farmer profile updated successfully.",
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to get all approved mandis for farmer dashboard & map: GET /api/v1/farmer/mandis
 */
export async function listApprovedMandisHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const mandis = await listApprovedMandis(lat, lng);

    res.status(200).json({
      success: true,
      message: "Approved mandis retrieved successfully.",
      data: { mandis },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to get official commodities: GET /api/v1/farmer/commodities
 */
export async function listCommoditiesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const commodities = await listOfficialCommodities();

    res.status(200).json({
      success: true,
      data: { commodities },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to book an arrival slot with KYC completion check: POST /api/v1/farmer/bookings
 */
export async function createFarmerBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { mandiProfileId, slotId, crop, variety, quantityQuintals, quantityKg, cropsList, vehicleNumber, notes } = req.body;

    if (!mandiProfileId || !slotId) {
      res.status(400).json({
        success: false,
        message: "mandiProfileId and slotId are required fields.",
        code: "INVALID_BOOKING_INPUT",
      });
      return;
    }

    const booking = await createFarmerBooking(userId, {
      mandiProfileId,
      slotId,
      crop,
      variety,
      quantityQuintals: quantityQuintals !== undefined ? Number(quantityQuintals) : undefined,
      quantityKg: quantityKg !== undefined ? Number(quantityKg) : undefined,
      cropsList,
      vehicleNumber,
      notes,
    });

    res.status(201).json({
      success: true,
      message: `Arrival booking request submitted to Mandi! Status: PENDING (Queue #${booking.queueNumber})`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Controller to get all bookings for the authenticated farmer: GET /api/v1/farmer/bookings
 */
export async function getFarmerBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const bookings = await getFarmerBookings(userId);

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
}

