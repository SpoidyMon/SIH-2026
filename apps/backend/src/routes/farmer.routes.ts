import { Router, Request, Response } from "express";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import {
  getFarmerProfileHandler,
  updateFarmerProfileHandler,
  listApprovedMandisHandler,
  createFarmerBookingHandler,
  getFarmerBookingsHandler,
  listCommoditiesHandler,
} from "../controllers/farmer.controller.js";
import { Role } from "@prisma/client";

const router: Router = Router();

// Public access to list mandis and commodities for farmer app & discovery
router.get("/mandis", listApprovedMandisHandler);
router.get("/commodities", listCommoditiesHandler);

// Protect sensitive farmer routes with authentication and requireRole(Role.FARMER)
router.use(authenticate, requireRole(Role.FARMER));

// Profile & KYC management routes
router.get("/profile", getFarmerProfileHandler);
router.put("/profile", updateFarmerProfileHandler);
router.patch("/profile", updateFarmerProfileHandler);

// Slot Booking & history
router.get("/bookings", getFarmerBookingsHandler);
router.post("/bookings", createFarmerBookingHandler);

// Farmer dashboard route
router.get("/dashboard", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Farmer Dashboard",
    data: {
      userId: req.user!.userId,
      role: req.user!.role,
      modules: ["Crop Management", "Marketplace Prices", "Weather Forecasts", "Direct Bidding", "Profile & Land Records"],
    },
  });
});

export default router;
