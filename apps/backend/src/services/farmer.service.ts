import { prisma, MandiApprovalStatus, BookingStatus } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import {
  UpdateFarmerProfileInput,
  FarmerFullProfileResponse,
} from "../interfaces/index.js";

/**
 * Generates the next sequential unique Farmer ID in the format FAR001, FAR002, etc.
 */
export async function generateNextFarmerCode(): Promise<string> {
  const count = await prisma.farmerProfile.count({
    where: { farmerCode: { not: null } },
  });
  const nextNum = count + 1;
  return `FAR${String(nextNum).padStart(3, "0")}`;
}

/**
 * Retrieves the authenticated farmer's full profile including address, KYC, and crop details.
 */
export async function getFarmerProfile(userId: string): Promise<FarmerFullProfileResponse> {
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
      farmerProfile: true,
    },
  });

  if (!user) {
    throw new AppError("Farmer account not found.", 404, "USER_NOT_FOUND");
  }

  // If farmerProfile doesn't exist yet, create an initial one with sequential farmerCode
  if (!user.farmerProfile) {
    const nextCode = await generateNextFarmerCode();
    const newProfile = await prisma.farmerProfile.create({
      data: {
        userId: user.id,
        farmerCode: nextCode,
        isProfileComplete: false,
        mainCrops: [],
        secondaryCrops: [],
      },
    });

    return {
      ...user,
      farmerProfile: newProfile as any,
    };
  }

  // If farmerProfile exists but lacks a farmerCode, assign one
  if (!user.farmerProfile.farmerCode) {
    const nextCode = await generateNextFarmerCode();
    const updatedProfile = await prisma.farmerProfile.update({
      where: { id: user.farmerProfile.id },
      data: { farmerCode: nextCode },
    });

    return {
      ...user,
      farmerProfile: updatedProfile as any,
    };
  }

  return user as any;
}

/**
 * Updates a farmer's personal information, KYC identity documents, address, and crop details.
 */
export async function updateFarmerProfile(
  userId: string,
  input: UpdateFarmerProfileInput
): Promise<FarmerFullProfileResponse> {
  // 1. Verify user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { farmerProfile: true },
  });

  if (!existingUser) {
    throw new AppError("Farmer account not found.", 404, "USER_NOT_FOUND");
  }

  // 2. Check if phone is being changed and if it already exists for another user
  if (input.phone && input.phone !== existingUser.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (existingPhone && existingPhone.id !== userId) {
      throw new AppError(
        "This phone number is already linked to another account.",
        409,
        "PHONE_EXISTS"
      );
    }
  }

  // 3. Prepare User fields to update
  const userUpdateData: { name?: string; phone?: string | null } = {};
  if (input.name !== undefined) {
    userUpdateData.name = input.name.trim();
  }
  if (input.phone !== undefined) {
    userUpdateData.phone = input.phone.trim() === "" ? null : input.phone.trim();
  }

  // 4. Prepare FarmerProfile fields to upsert
  const profileUpsertData: Record<string, unknown> = {};

  if (input.dob !== undefined) profileUpsertData.dob = input.dob?.trim() || null;
  if (input.address !== undefined) profileUpsertData.address = input.address?.trim() || null;
  if (input.idType !== undefined) profileUpsertData.idType = input.idType;
  if (input.idNumber !== undefined) profileUpsertData.idNumber = input.idNumber?.trim() || null;
  if (input.avatarUrl !== undefined) profileUpsertData.avatarUrl = input.avatarUrl?.trim() || null;

  if (input.addressLine1 !== undefined) profileUpsertData.addressLine1 = input.addressLine1?.trim() || null;
  if (input.addressLine2 !== undefined) profileUpsertData.addressLine2 = input.addressLine2?.trim() || null;
  if (input.village !== undefined) profileUpsertData.village = input.village?.trim() || null;
  if (input.taluka !== undefined) profileUpsertData.taluka = input.taluka?.trim() || null;
  if (input.district !== undefined) profileUpsertData.district = input.district?.trim() || null;
  if (input.state !== undefined) profileUpsertData.state = input.state?.trim() || null;
  if (input.pincode !== undefined) profileUpsertData.pincode = input.pincode?.trim() || null;
  if (input.landSizeAcres !== undefined) profileUpsertData.landSizeAcres = input.landSizeAcres;
  if (input.mainCrops !== undefined) {
    profileUpsertData.mainCrops = input.mainCrops.map((c) => c.trim()).filter(Boolean);
  }
  if (input.secondaryCrops !== undefined) {
    profileUpsertData.secondaryCrops = input.secondaryCrops.map((c) => c.trim()).filter(Boolean);
  }
  if (input.irrigationType !== undefined) profileUpsertData.irrigationType = input.irrigationType?.trim() || null;
  if (input.farmLocation !== undefined) profileUpsertData.farmLocation = input.farmLocation?.trim() || null;

  // Calculate profile completion status
  const currentProfile = existingUser.farmerProfile;
  const finalAddress = (input.address !== undefined ? input.address : currentProfile?.address) || (input.addressLine1 !== undefined ? input.addressLine1 : currentProfile?.addressLine1);
  const finalDob = input.dob !== undefined ? input.dob : currentProfile?.dob;
  const finalIdType = input.idType !== undefined ? input.idType : currentProfile?.idType;
  const finalIdNumber = input.idNumber !== undefined ? input.idNumber : currentProfile?.idNumber;

  const isComplete = Boolean(
    finalAddress && finalAddress.trim() !== "" &&
    finalDob && finalDob.trim() !== "" &&
    finalIdType &&
    finalIdNumber && finalIdNumber.trim() !== ""
  );

  profileUpsertData.isProfileComplete = isComplete;

  // 5. Ensure farmerCode is set if missing
  let farmerCode = currentProfile?.farmerCode;
  if (!farmerCode) {
    farmerCode = await generateNextFarmerCode();
    profileUpsertData.farmerCode = farmerCode;
  }

  // 6. Execute transaction to update User and upsert FarmerProfile
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
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
    }),
    prisma.farmerProfile.upsert({
      where: { userId },
      create: {
        userId,
        farmerCode,
        ...profileUpsertData,
      },
      update: profileUpsertData,
    }),
  ]);

  // 7. Return refreshed complete profile
  const fullProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  return {
    ...updatedUser,
    farmerProfile: fullProfile as any,
  };
}

/**
 * Calculates haversine distance in KM between two lat/lng coordinates
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Lists all approved mandis from database with slots and metrics for farmer app.
 * Automatically sorts nearest first if user GPS coordinates (userLat, userLng) are provided.
 */
export async function listApprovedMandis(userLat?: number, userLng?: number) {
  const mandis = await prisma.mandiProfile.findMany({
    where: {
      OR: [
        { approvalStatus: MandiApprovalStatus.APPROVED },
        { isLocationSet: true },
        { latitude: { not: null } },
      ],
    },
    include: {
      slots: {
        where: { isActive: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
    orderBy: { mandiName: "asc" },
  });

  const formattedMandis = mandis.map((m) => {
    // Collect all crops offered in slots
    const slotCrops = new Set<string>();
    m.slots.forEach((s) => {
      if (s.crop) {
        s.crop.split(",").forEach((c) => slotCrops.add(c.trim()));
      }
      if (s.allowedCrops && Array.isArray(s.allowedCrops)) {
        (s.allowedCrops as any[]).forEach((item) => {
          if (item?.crop) slotCrops.add(item.crop.trim());
        });
      }
    });

    const acceptedCropsList = Array.from(slotCrops);
    const finalAcceptedCrops =
      acceptedCropsList.length > 0
        ? acceptedCropsList
        : m.acceptedCrops && m.acceptedCrops.length > 0
        ? m.acceptedCrops
        : m.topCrop
        ? m.topCrop.split(",").map((s) => s.trim())
        : ["Wheat", "Mustard", "Onion", "Tomato"];

    const defaultLat = 18.5204 + (Math.random() * 0.1 - 0.05);
    const defaultLng = 73.8567 + (Math.random() * 0.1 - 0.05);
    const lat = m.latitude !== null && m.latitude !== undefined ? m.latitude : defaultLat;
    const lng = m.longitude !== null && m.longitude !== undefined ? m.longitude : defaultLng;

    let distanceKm: number | null = null;
    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      distanceKm = calculateDistanceKm(userLat, userLng, lat, lng);
    }

    return {
      id: m.id,
      name: m.mandiName || "APMC Mandi Yard",
      mandiCode: m.mandiCode || "MAN001",
      apmcCode: m.apmcCode,
      district: m.district || "Pune",
      address: m.address || "APMC Main Market Yard",
      pincode: m.pincode || "411001",
      state: m.state || "Maharashtra",
      latitude: lat,
      longitude: lng,
      distanceKm,
      topCrop: finalAcceptedCrops.slice(0, 2).join(", "),
      acceptedCrops: finalAcceptedCrops,
      modalPrice: m.modalPrice || "₹28 / kg",
      priceTrend: m.priceTrend || "+₹2/kg today",
      trendDirection: m.trendDirection || "up",
      estimatedQueueTime: m.estimatedQueueTime || "15 mins wait",
      activeFarmersCount: m.activeFarmersCount || 24,
      isOpen: m.isOpen ?? true,
      operatingHours: m.operatingHours || "08:00 AM - 06:00 PM (Mon-Sat)",
      closedDays: m.closedDays || [],
      closedHours: m.closedHours,
      isLocationSet: m.isLocationSet ?? true,
      slots: m.slots,
    };
  });

  // Sort nearest first if user coordinates provided
  if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
    formattedMandis.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return formattedMandis;
}

/**
 * Lists all official standard agricultural commodities from database.
 */
export async function listOfficialCommodities() {
  return prisma.commodity.findMany({
    orderBy: { name: "asc" },
  });
}

export interface CreateFarmerBookingInput {
  mandiProfileId: string;
  slotId: string;
  crop?: string;
  variety?: string;
  quantityQuintals?: number;
  quantityKg?: number;
  cropsList?: Array<{
    crop: string;
    quantityKg: number;
    ratePerKg?: number;
    estimatedAmount?: number;
  }>;
  vehicleNumber?: string;
  notes?: string;
}

/**
 * Creates a gate arrival slot booking for a farmer with KYC completion check.
 * - Prevents reapplication if farmer was previously REJECTED for this specific slot.
 * - Stores multi-crop breakdown and quantities in KG.
 * - Generates initial PENDING status (Official token and QR generated upon Mandi Operator acceptance).
 */
export async function createFarmerBooking(
  farmerUserId: string,
  input: CreateFarmerBookingInput
): Promise<any> {
  // 1. Verify farmer profile is complete
  const farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId: farmerUserId },
  });

  if (!farmerProfile || !farmerProfile.isProfileComplete) {
    throw new AppError(
      "Profile KYC incomplete. Please complete your profile (Address, DOB, ID proof) before booking a mandi slot.",
      403,
      "PROFILE_INCOMPLETE"
    );
  }

  // 2. Prevent reapplication if previous booking for this slot was rejected
  const previousRejected = await prisma.booking.findFirst({
    where: {
      farmerId: farmerUserId,
      slotId: input.slotId,
      status: BookingStatus.REJECTED,
    },
  });

  if (previousRejected) {
    throw new AppError(
      `Your booking application for this slot was rejected by the Mandi administration (Reason: ${
        previousRejected.rejectionReason || "Slot limit/criteria not met"
      }). You cannot reapply for this slot.`,
      400,
      "SLOT_BOOKING_REJECTED"
    );
  }

  // Also check if already has an active pending/accepted booking on the same slot
  const existingActive = await prisma.booking.findFirst({
    where: {
      farmerId: farmerUserId,
      slotId: input.slotId,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.VERIFIED] },
    },
  });

  if (existingActive) {
    throw new AppError(
      "You already have an active booking for this arrival slot.",
      400,
      "DUPLICATE_BOOKING"
    );
  }

  // 3. Verify slot exists and has capacity
  const slot = await prisma.mandiSlot.findUnique({
    where: { id: input.slotId },
  });

  if (!slot || !slot.isActive) {
    throw new AppError("The requested mandi arrival slot is no longer active or closed.", 404, "SLOT_NOT_FOUND");
  }

  if (slot.availableBookings <= 0) {
    throw new AppError("This arrival slot has reached its maximum farmer limit.", 400, "SLOT_CAPACITY_FULL");
  }

  // 4. Calculate total quantity in KG and Quintals, and estimated payout
  let totalKg = input.quantityKg || 0;
  let primaryCrop = input.crop || "Agricultural Crops";
  let estimatedPayout = 0;

  if (input.cropsList && Array.isArray(input.cropsList) && input.cropsList.length > 0) {
    totalKg = input.cropsList.reduce((sum, item) => sum + (Number(item.quantityKg) || 0), 0);
    primaryCrop = input.cropsList.map((c) => c.crop).join(", ");
    estimatedPayout = input.cropsList.reduce((sum, item) => {
      const rate = Number(item.ratePerKg) || 25;
      const amt = item.estimatedAmount || (Number(item.quantityKg) || 0) * rate;
      return sum + amt;
    }, 0);
  } else if (!totalKg && input.quantityQuintals) {
    totalKg = input.quantityQuintals * 100;
  }

  const finalQuintals = input.quantityQuintals || Number((totalKg / 100).toFixed(2));

  // 5. Expected Queue Number in this slot
  const existingCount = await prisma.booking.count({
    where: { slotId: input.slotId },
  });
  const queueNumber = existingCount + 1;

  // 6. Create booking with PENDING status (Mandi Operator will accept/reject)
  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        token: `REQ-${Date.now().toString().slice(-6)}`,
        queueNumber,
        farmerId: farmerUserId,
        mandiProfileId: input.mandiProfileId,
        slotId: input.slotId,
        crop: primaryCrop,
        variety: input.variety || "Grade-A Crops",
        cropsList: (input.cropsList as any) || null,
        quantityKg: totalKg,
        quantityQuintals: finalQuintals,
        estimatedPayout: estimatedPayout > 0 ? estimatedPayout : null,
        vehicleNumber: input.vehicleNumber || null,
        qrCodeData: null,
        notes: input.notes || null,
        status: BookingStatus.PENDING,
      },
      include: {
        mandiProfile: true,
        slot: true,
      },
    }),
    prisma.mandiSlot.update({
      where: { id: input.slotId },
      data: {
        bookedFarmers: { increment: 1 },
        availableBookings: { decrement: 1 },
        bookedCapacityQuintals: { increment: finalQuintals },
        bookedCapacityKg: { increment: totalKg },
      },
    }),
  ]);

  return booking;
}

/**
 * Gets all bookings made by the authenticated farmer.
 */
export async function getFarmerBookings(farmerUserId: string): Promise<any[]> {
  return prisma.booking.findMany({
    where: { farmerId: farmerUserId },
    include: {
      mandiProfile: true,
      slot: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

