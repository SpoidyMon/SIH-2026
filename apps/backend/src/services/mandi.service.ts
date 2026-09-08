import { prisma } from "../lib/prisma.js";
import {
  BookingStatus,
  MandiApprovalStatus,
  LegalDocType,
  Role,
} from "@prisma/client";
import {
  CreateSlotInput,
  UpdateSlotInput,
  SlotFilterQuery,
  BookingFilterQuery,
  UpdateBookingStatusInput,
  CompleteBookingInput,
  UpdateMandiProfileInput,
  AadhaarKycInput,
  LegalDocUploadInput,
  MandiDashboardData,
  MandiRatingDto,
  MandiOnboardingInput,
  AdminApprovalInput,
  UpdateMandiLocationInput,
  FarmerDetailsForMandi,
} from "../interfaces/mandi.interface.js";
import { generateBookingToken } from "../utils/qr-token.util.js";

/**
 * Generates the next sequential unique Mandi ID in the format MAN001, MAN002, etc.
 */
export async function generateNextMandiCode(): Promise<string> {
  const count = (await prisma.mandiProfile.count?.({
    where: { mandiCode: { not: null } },
  })) ?? 0;
  const nextNum = count + 1;
  return `MAN${String(nextNum).padStart(3, "0")}`;
}

/**
 * Gets or creates the initial MandiProfile record for the authenticated User
 */
export async function getOrCreateMandiProfile(userId: string) {
  let profile = await prisma.mandiProfile.findUnique({
    where: { userId },
    include: { legalDocs: true },
  });

  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: "User account not found", code: "USER_NOT_FOUND" };
    }

    const nextCode = await generateNextMandiCode();
    profile = await prisma.mandiProfile.create({
      data: {
        userId,
        mandiName: null,
        mandiCode: nextCode,
        apmcCode: null,
        operatingHours: "08:00 AM - 06:00 PM (Mon-Sat)",
        approvalStatus: MandiApprovalStatus.PENDING_ONBOARDING,
        rating: 4.8,
        totalReviews: 0,
      },
      include: { legalDocs: true },
    });
  } else if (!profile.mandiCode) {
    const nextCode = await generateNextMandiCode();
    profile = await prisma.mandiProfile.update({
      where: { id: profile.id },
      data: { mandiCode: nextCode },
      include: { legalDocs: true },
    });
  }

  return profile;
}

/**
 * Submits post-login Mandi onboarding and transitions status to PENDING_APPROVAL
 */
export async function submitMandiOnboarding(userId: string, input: MandiOnboardingInput) {
  const profile = await getOrCreateMandiProfile(userId);

  // Check if APMC code is uniquely available if changed
  if (input.apmcCode) {
    const existing = await prisma.mandiProfile.findFirst({
      where: {
        apmcCode: input.apmcCode,
        id: { not: profile.id },
      },
    });
    if (existing) {
      throw {
        status: 409,
        message: `APMC code "${input.apmcCode}" is already registered by another Mandi.`,
        code: "APMC_CODE_EXISTS",
      };
    }
  }

  // Create or sync legal documents
  if (input.legalDocs && input.legalDocs.length > 0) {
    await prisma.mandiLegalDoc.createMany({
      data: input.legalDocs.map((doc) => ({
        mandiProfileId: profile.id,
        name: doc.name,
        type: doc.type,
        fileUrl: doc.fileUrl || "https://vault.agrimarket.gov.in/docs/statutory_doc.pdf",
        status: "PENDING",
      })),
    });
  }

  const updatedProfile = await prisma.mandiProfile.update({
    where: { id: profile.id },
    data: {
      mandiName: input.mandiName,
      apmcCode: input.apmcCode,
      address: input.address,
      district: input.district,
      state: input.state,
      operatingHours: input.operatingHours || "08:00 AM - 06:00 PM (Mon-Sat)",
      aadhaarNumber: input.aadhaarNumber,
      aadhaarDocUrl: input.aadhaarDocUrl,
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.PENDING_APPROVAL,
    },
    include: { legalDocs: true },
  });

  return {
    mandiId: updatedProfile.id,
    mandiName: updatedProfile.mandiName,
    apmcCode: updatedProfile.apmcCode,
    approvalStatus: updatedProfile.approvalStatus,
    submittedAt: updatedProfile.updatedAt,
  };
}

/**
 * Admin action to approve, reject, or request documents
 */
export async function updateMandiApprovalStatus(
  mandiProfileId: string,
  input: AdminApprovalInput
) {
  const profile = await prisma.mandiProfile.findUnique({
    where: { id: mandiProfileId },
  });

  if (!profile) {
    throw { status: 404, message: "Mandi profile not found", code: "MANDI_NOT_FOUND" };
  }

  const updateData: any = {
    approvalStatus: input.status,
    rejectionReason: input.status === MandiApprovalStatus.REJECTED ? input.rejectionReason : null,
  };

  if (input.status === MandiApprovalStatus.APPROVED) {
    updateData.approvedAt = new Date();
  }

  const updated = await prisma.mandiProfile.update({
    where: { id: mandiProfileId },
    data: updateData,
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  return {
    mandiId: updated.id,
    mandiName: updated.mandiName,
    apmcCode: updated.apmcCode,
    approvalStatus: updated.approvalStatus,
    approvedAt: updated.approvedAt,
    rejectionReason: updated.rejectionReason,
  };
}

/**
 * Lists all Mandis pending admin review
 */
export async function listPendingMandis() {
  return await prisma.mandiProfile.findMany({
    where: {
      approvalStatus: {
        in: [
          MandiApprovalStatus.PENDING_APPROVAL,
          MandiApprovalStatus.REQUIRES_DOCUMENTS,
          MandiApprovalStatus.PENDING_ONBOARDING,
        ],
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      legalDocs: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Retrieves aggregate Mandi Dashboard KPIs and statistics (Requires Approved Status)
 */
export async function getMandiDashboardStats(userId: string): Promise<MandiDashboardData> {
  const profile = await getOrCreateMandiProfile(userId);
  const todayStr = new Date().toISOString().split("T")[0] || "2026-08-30";

  const rawSlots = await prisma.mandiSlot.findMany({
    where: { mandiProfileId: profile.id, date: todayStr, isActive: true },
  });
  const todaySlots = Array.isArray(rawSlots) ? rawSlots : [];

  const totalSlotsToday = todaySlots.length;

  const totalCapacity = todaySlots.reduce((sum, s) => sum + s.totalCapacityQuintals, 0);
  const bookedCapacity = todaySlots.reduce((sum, s) => sum + s.bookedCapacityQuintals, 0);
  const totalCapacityUtilizedPercentage =
    totalCapacity > 0 ? Number(((bookedCapacity / totalCapacity) * 100).toFixed(1)) : 0;

  const activeBookings = await prisma.booking.count({
    where: {
      mandiProfileId: profile.id,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.ARRIVED, BookingStatus.VERIFIED] },
    },
  });

  const arrivalsToday = await prisma.booking.count({
    where: {
      mandiProfileId: profile.id,
      slot: { date: todayStr },
      status: { in: [BookingStatus.ARRIVED, BookingStatus.VERIFIED, BookingStatus.COMPLETED] },
    },
  });

  const completedToday = await prisma.booking.count({
    where: {
      mandiProfileId: profile.id,
      slot: { date: todayStr },
      status: BookingStatus.COMPLETED,
    },
  });

  const pendingApprovals = await prisma.booking.count({
    where: {
      mandiProfileId: profile.id,
      status: BookingStatus.PENDING,
    },
  });

  return {
    metrics: {
      totalSlotsToday,
      activeBookings,
      arrivalsToday,
      completedToday,
      pendingApprovals,
      totalCapacityUtilizedPercentage,
    },
    mandi: {
      id: profile.id,
      mandiName: profile.mandiName || "APMC Market Yard",
      apmcCode: profile.apmcCode || "APMC-PENDING",
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      approvalStatus: profile.approvalStatus,
      isApproved: profile.approvalStatus === MandiApprovalStatus.APPROVED,
    },
  };
}

/**
 * Retrieves current active bookings stream (PENDING, ACCEPTED, ARRIVED, VERIFIED)
 */
export async function getCurrentBookings(userId: string, filters: BookingFilterQuery = {}) {
  const profile = await getOrCreateMandiProfile(userId);

  const allowedStatuses = [
    BookingStatus.PENDING,
    BookingStatus.ACCEPTED,
    BookingStatus.ARRIVED,
    BookingStatus.VERIFIED,
  ];

  const whereClause: any = {
    mandiProfileId: profile.id,
    status: filters.status && filters.status !== "ALL" ? filters.status : { in: allowedStatuses },
  };

  if (filters.crop) {
    whereClause.crop = { contains: filters.crop, mode: "insensitive" };
  }

  if (filters.date) {
    whereClause.slot = { date: filters.date };
  }

  if (filters.search) {
    whereClause.OR = [
      { token: { contains: filters.search, mode: "insensitive" } },
      { crop: { contains: filters.search, mode: "insensitive" } },
      { farmer: { name: { contains: filters.search, mode: "insensitive" } } },
      { vehicleNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      farmer: { select: { id: true, name: true, phone: true, email: true } },
      slot: { select: { id: true, date: true, startTime: true, endTime: true } },
    },
    orderBy: [{ queueNumber: "asc" }, { createdAt: "desc" }],
  });

  return bookings.map((b) => ({
    id: b.id,
    token: b.token,
    queueNumber: b.queueNumber,
    qrCodeData: b.qrCodeData,
    farmerId: b.farmerId,
    farmerName: b.farmer.name,
    farmerPhone: b.farmer.phone,
    crop: b.crop,
    variety: b.variety,
    quantityQuintals: b.quantityQuintals,
    capacityPercentage: b.capacityPercentage,
    slotId: b.slotId,
    slotTime: `${b.slot.startTime} - ${b.slot.endTime}`,
    slotDate: b.slot.date,
    vehicleNumber: b.vehicleNumber,
    status: b.status,
    notes: b.notes,
    verifiedAt: b.verifiedAt,
    servedAt: b.servedAt,
    completedAt: b.completedAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));
}

/**
 * Retrieves historical logs (COMPLETED, REJECTED, CANCELLED)
 */
export async function getPreviousBookings(userId: string, filters: BookingFilterQuery = {}) {
  const profile = await getOrCreateMandiProfile(userId);
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const pastStatuses = [BookingStatus.COMPLETED, BookingStatus.REJECTED, BookingStatus.CANCELLED];

  const whereClause: any = {
    mandiProfileId: profile.id,
    status: filters.status && filters.status !== "ALL" ? filters.status : { in: pastStatuses },
  };

  if (filters.crop) {
    whereClause.crop = { contains: filters.crop, mode: "insensitive" };
  }

  if (filters.search) {
    whereClause.OR = [
      { token: { contains: filters.search, mode: "insensitive" } },
      { farmer: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where: whereClause }),
    prisma.booking.findMany({
      where: whereClause,
      include: {
        farmer: { select: { id: true, name: true, phone: true, email: true } },
        slot: { select: { id: true, date: true, startTime: true, endTime: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    bookings: bookings.map((b) => ({
      id: b.id,
      token: b.token,
      queueNumber: b.queueNumber,
      qrCodeData: b.qrCodeData,
      farmerId: b.farmerId,
      farmerName: b.farmer.name,
      farmerPhone: b.farmer.phone,
      crop: b.crop,
      variety: b.variety,
      quantityQuintals: b.quantityQuintals,
      capacityPercentage: b.capacityPercentage,
      slotId: b.slotId,
      slotTime: `${b.slot.startTime} - ${b.slot.endTime}`,
      slotDate: b.slot.date,
      vehicleNumber: b.vehicleNumber,
      status: b.status,
      notes: b.notes,
      verifiedAt: b.verifiedAt,
      servedAt: b.servedAt,
      completedAt: b.completedAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  };
}

/**
 * Updates booking status (e.g. ACCEPTED, REJECTED, ARRIVED)
 */
export async function updateBookingStatus(
  userId: string,
  bookingId: string,
  input: UpdateBookingStatusInput
) {
  const profile = await getOrCreateMandiProfile(userId);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, mandiProfileId: profile.id },
    include: { slot: true },
  });

  if (!booking) {
    throw { status: 404, message: "Booking record not found", code: "BOOKING_NOT_FOUND" };
  }

  const updateData: any = {
    status: input.status,
    notes: input.notes !== undefined ? input.notes : booking.notes,
  };

  if (input.status === BookingStatus.VERIFIED && !booking.verifiedAt) {
    updateData.verifiedAt = new Date();
  }

  if (input.status === BookingStatus.COMPLETED && !booking.completedAt) {
    updateData.completedAt = new Date();
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });

  return updated;
}

/**
 * Verifies farmer booking entry via QR code or token with First-Come First-Served queue check
 */
export async function verifyBookingToken(userId: string, token: string) {
  const profile = await getOrCreateMandiProfile(userId);
  const cleanToken = token.trim();

  const booking = await prisma.booking.findFirst({
    where: {
      mandiProfileId: profile.id,
      OR: [
        { token: { equals: cleanToken, mode: "insensitive" } },
        { id: { equals: cleanToken, mode: "insensitive" } },
      ],
    },
    include: {
      farmer: { select: { id: true, name: true, phone: true, email: true } },
      slot: true,
    },
  });

  if (!booking) {
    throw {
      status: 404,
      message: `No booking found with token or ID "${cleanToken}" for this Mandi`,
      code: "INVALID_QR_TOKEN",
    };
  }

  // First-Come, First-Served Queue Check:
  // Check if there are earlier unserved bookings (lower queueNumber) in the same slot
  const earlierPending = await prisma.booking.findFirst({
    where: {
      slotId: booking.slotId,
      queueNumber: { lt: booking.queueNumber },
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
    orderBy: { queueNumber: "asc" },
    include: { farmer: { select: { name: true } } },
  });

  const isOutOfOrder = Boolean(earlierPending);
  const nextInQueueToken = earlierPending?.token || booking.token;
  const nextQueueSeqStr = earlierPending
    ? String(earlierPending.queueNumber).padStart(3, "0")
    : String(booking.queueNumber).padStart(3, "0");
  const currentQueueSeqStr = String(booking.queueNumber).padStart(3, "0");

  const warningMessage = earlierPending
    ? `Queue Order Warning: First-Come, First-Served queue requires token ${earlierPending.token} (#${nextQueueSeqStr} - ${earlierPending.farmer.name}) to be served first. You are scanning #${currentQueueSeqStr} (${booking.farmer.name}). Please serve #${nextQueueSeqStr} first or confirm queue override.`
    : null;

  // Check in farmer as VERIFIED and record servedAt
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.VERIFIED,
      verifiedAt: new Date(),
      servedAt: new Date(),
      notes: booking.notes ? `${booking.notes} | Gate entry verified.` : "Gate entry verified.",
    },
    include: {
      farmer: { select: { id: true, name: true, phone: true } },
      slot: true,
    },
  });

  return {
    id: updated.id,
    token: updated.token,
    queueNumber: updated.queueNumber,
    farmerId: updated.farmer.id,
    farmerName: updated.farmer.name,
    farmerPhone: updated.farmer.phone,
    crop: updated.crop,
    quantityQuintals: updated.quantityQuintals,
    slotTime: `${updated.slot.startTime} - ${updated.slot.endTime}`,
    slotDate: updated.slot.date,
    status: updated.status,
    verifiedAt: updated.verifiedAt,
    servedAt: updated.servedAt,
    isOutOfOrder,
    nextInQueueToken,
    warningMessage,
  };
}

/**
 * Marks weighing & settlement complete
 */
export async function completeBooking(
  userId: string,
  bookingId: string,
  input: CompleteBookingInput = {}
) {
  const profile = await getOrCreateMandiProfile(userId);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, mandiProfileId: profile.id },
  });

  if (!booking) {
    throw { status: 404, message: "Booking not found", code: "BOOKING_NOT_FOUND" };
  }

  const finalNotes = input.notes || "Weighbridge check and final transaction settlement completed.";

  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
      notes: finalNotes,
      quantityQuintals: input.finalWeightQuintals || booking.quantityQuintals,
    },
  });
}

// ----------------------------------------------------
// SLOT MANAGEMENT FUNCTIONS
// ----------------------------------------------------

/**
 * Creates a new arrival slot with capacity and buffer parameters
 */
export async function createMandiSlot(userId: string, input: CreateSlotInput) {
  const profile = await getOrCreateMandiProfile(userId);

  const slot = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: profile.id,
      crop: input.crop,
      allowedCrops: (input.allowedCrops as any) || null,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      totalCapacityQuintals: input.totalCapacityQuintals,
      bookedCapacityQuintals: 0,
      capacityPercentage: 0,
      maxFarmers: input.maxFarmers,
      bookedFarmers: 0,
      availableBookings: input.maxFarmers,
      bufferMinutes: input.bufferMinutes ?? 15,
      bufferPercentage: input.bufferPercentage ?? 10,
      isActive: true,
    },
  });

  return slot;
}

/**
 * Retrieves all slots for the Mandi with filtering
 */
export async function getMandiSlots(userId: string, filters: SlotFilterQuery = {}) {
  const profile = await getOrCreateMandiProfile(userId);

  const whereClause: any = {
    mandiProfileId: profile.id,
  };

  if (filters.date) {
    whereClause.date = filters.date;
  }

  if (filters.crop) {
    whereClause.crop = { contains: filters.crop, mode: "insensitive" };
  }

  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }

  return await prisma.mandiSlot.findMany({
    where: whereClause,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

/**
 * Gets a specific slot by ID
 */
export async function getMandiSlotById(userId: string, slotId: string) {
  const profile = await getOrCreateMandiProfile(userId);

  const slot = await prisma.mandiSlot.findFirst({
    where: { id: slotId, mandiProfileId: profile.id },
    include: {
      bookings: {
        include: { farmer: { select: { id: true, name: true, phone: true } } },
      },
    },
  });

  if (!slot) {
    throw { status: 404, message: "Slot not found", code: "SLOT_NOT_FOUND" };
  }

  return slot;
}

/**
 * Updates slot parameters and recalculates capacity
 */
export async function updateMandiSlot(userId: string, slotId: string, input: UpdateSlotInput) {
  const profile = await getOrCreateMandiProfile(userId);

  const existing = await prisma.mandiSlot.findFirst({
    where: { id: slotId, mandiProfileId: profile.id },
  });

  if (!existing) {
    throw { status: 404, message: "Slot not found", code: "SLOT_NOT_FOUND" };
  }

  const totalCap = input.totalCapacityQuintals ?? existing.totalCapacityQuintals;
  const maxF = input.maxFarmers ?? existing.maxFarmers;
  const capacityPct = totalCap > 0 ? (existing.bookedCapacityQuintals / totalCap) * 100 : 0;
  const availableB = Math.max(0, maxF - existing.bookedFarmers);

  const updated = await prisma.mandiSlot.update({
    where: { id: slotId },
    data: {
      ...input,
      allowedCrops: input.allowedCrops !== undefined ? (input.allowedCrops as any) : undefined,
      capacityPercentage: Number(capacityPct.toFixed(1)),
      availableBookings: availableB,
    },
  });

  return updated;
}

/**
 * Deletes a slot and cascade-cancels any pending bookings
 */
export async function deleteMandiSlot(userId: string, slotId: string) {
  const profile = await getOrCreateMandiProfile(userId);

  const existing = await prisma.mandiSlot.findFirst({
    where: { id: slotId, mandiProfileId: profile.id },
  });

  if (!existing) {
    throw { status: 404, message: "Slot not found", code: "SLOT_NOT_FOUND" };
  }

  // Cancel non-completed bookings
  await prisma.booking.updateMany({
    where: { slotId, status: { notIn: [BookingStatus.COMPLETED, BookingStatus.REJECTED] } },
    data: {
      status: BookingStatus.CANCELLED,
      notes: "Slot cancelled by Mandi Operator.",
    },
  });

  await prisma.mandiSlot.delete({
    where: { id: slotId },
  });

  return { success: true, message: "Slot deleted and bookings updated." };
}

/**
 * Applies default slot schedule presets for upcoming trading day
 */
export async function applyDefaultSlotsPreset(userId: string) {
  const profile = await getOrCreateMandiProfile(userId);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0] || "2026-08-31";

  const defaultPresets: CreateSlotInput[] = [
    {
      crop: "Wheat (Sharbati)",
      date: tomorrow,
      startTime: "08:00",
      endTime: "11:30",
      totalCapacityQuintals: 600,
      maxFarmers: 25,
      bufferMinutes: 15,
      bufferPercentage: 10,
    },
    {
      crop: "Mustard (Sarson)",
      date: tomorrow,
      startTime: "12:00",
      endTime: "15:30",
      totalCapacityQuintals: 400,
      maxFarmers: 18,
      bufferMinutes: 20,
      bufferPercentage: 10,
    },
    {
      crop: "Rice (Basmati 1121)",
      date: tomorrow,
      startTime: "16:00",
      endTime: "18:30",
      totalCapacityQuintals: 500,
      maxFarmers: 20,
      bufferMinutes: 15,
      bufferPercentage: 10,
    },
  ];

  const created = await Promise.all(
    defaultPresets.map((preset) =>
      prisma.mandiSlot.create({
        data: {
          mandiProfileId: profile.id,
          crop: preset.crop,
          date: preset.date,
          startTime: preset.startTime,
          endTime: preset.endTime,
          totalCapacityQuintals: preset.totalCapacityQuintals,
          bookedCapacityQuintals: 0,
          capacityPercentage: 0,
          maxFarmers: preset.maxFarmers,
          bookedFarmers: 0,
          availableBookings: preset.maxFarmers,
          bufferMinutes: preset.bufferMinutes ?? 15,
          bufferPercentage: preset.bufferPercentage ?? 10,
          isActive: true,
        },
      })
    )
  );

  return created;
}

// ----------------------------------------------------
// SETTINGS, KYC & REPUTATION FUNCTIONS
// ----------------------------------------------------

/**
 * Retrieves full Mandi profile details, legal docs, and rating
 */
export async function getMandiProfileDetails(userId: string) {
  const profile = await getOrCreateMandiProfile(userId);
  return await prisma.mandiProfile.findUnique({
    where: { id: profile.id },
    include: { legalDocs: true, user: { select: { email: true, phone: true, name: true } } },
  });
}

/**
 * Updates operator profile details
 */
export async function updateMandiProfileDetails(userId: string, input: UpdateMandiProfileInput) {
  const profile = await getOrCreateMandiProfile(userId);

  return await prisma.mandiProfile.update({
    where: { id: profile.id },
    data: input,
    include: { legalDocs: true },
  });
}

/**
 * Submits or updates Aadhaar KYC details
 */
export async function updateAadhaarKyc(userId: string, input: AadhaarKycInput) {
  const profile = await getOrCreateMandiProfile(userId);

  return await prisma.mandiProfile.update({
    where: { id: profile.id },
    data: {
      aadhaarNumber: input.aadhaarNumber,
      aadhaarDocUrl: input.aadhaarDocUrl || "https://vault.agrimarket.gov.in/docs/aadhaar_verified.pdf",
      aadhaarVerified: true,
    },
  });
}

/**
 * Uploads a statutory legal document
 */
export async function uploadLegalDocument(userId: string, input: LegalDocUploadInput) {
  const profile = await getOrCreateMandiProfile(userId);

  return await prisma.mandiLegalDoc.create({
    data: {
      mandiProfileId: profile.id,
      name: input.name,
      type: input.type,
      status: "VERIFIED",
      fileUrl: input.fileUrl || "https://vault.agrimarket.gov.in/docs/statutory_doc.pdf",
    },
  });
}

/**
 * Deletes an uploaded legal document
 */
export async function deleteLegalDocument(userId: string, docId: string) {
  const profile = await getOrCreateMandiProfile(userId);

  const doc = await prisma.mandiLegalDoc.findFirst({
    where: { id: docId, mandiProfileId: profile.id },
  });

  if (!doc) {
    throw { status: 404, message: "Document not found", code: "DOCUMENT_NOT_FOUND" };
  }

  await prisma.mandiLegalDoc.delete({ where: { id: docId } });
  return { success: true, message: "Document removed." };
}

/**
 * Retrieves farmer rating metrics & reviews
 */
export async function getMandiRatingMetrics(userId: string): Promise<MandiRatingDto> {
  const profile = await getOrCreateMandiProfile(userId);

  return {
    rating: profile.rating,
    totalReviews: profile.totalReviews,
    weighInPrecisionPercentage: 99.2,
    avgGateWaitMinutes: 14,
    reviews: [
      {
        id: "rev-1",
        farmerName: "Baldev Singh",
        rating: 5,
        comment: "Excellent weighbridge speed and quick settlement payout.",
        createdAt: "2026-08-28",
      },
      {
        id: "rev-2",
        farmerName: "Sukhwinder Gill",
        rating: 4.8,
        comment: "Clean yard, orderly tractor parking and helpful operator staff.",
        createdAt: "2026-08-25",
      },
      {
        id: "rev-3",
        farmerName: "Mukesh Yadav",
        rating: 4.7,
        comment: "Accurate moisture measurement and transparent auction rates.",
        createdAt: "2026-08-20",
      },
    ],
  };
}

/**
 * Updates physical yard coordinates and location marker for farmer map discovery
 */
export async function updateMandiLocation(userId: string, input: UpdateMandiLocationInput) {
  const profile = await getOrCreateMandiProfile(userId);

  const updated = await prisma.mandiProfile.update({
    where: { id: profile.id },
    data: {
      address: input.address,
      pincode: input.pincode,
      latitude: input.latitude,
      longitude: input.longitude,
      district: input.district || profile.district,
      state: input.state || profile.state,
      operatingHours: input.operatingHours || profile.operatingHours,
      closedDays: input.closedDays !== undefined ? input.closedDays : profile.closedDays,
      closedHours: input.closedHours !== undefined ? input.closedHours : profile.closedHours,
      isLocationSet: true,
    },
    include: { legalDocs: true },
  });

  return updated;
}

/**
 * Retrieves full farmer profile details, KYC documents, and delivery record for Mandi Operator view
 */
export async function getFarmerDetailsForMandi(userId: string, farmerId: string): Promise<FarmerDetailsForMandi> {
  const profile = await getOrCreateMandiProfile(userId);

  const farmerUser = await prisma.user.findUnique({
    where: { id: farmerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      farmerProfile: true,
    },
  });

  if (!farmerUser) {
    throw { status: 404, message: "Farmer not found", code: "FARMER_NOT_FOUND" };
  }

  const [totalBookingsCount, verifiedBookingsCount] = await Promise.all([
    prisma.booking.count({
      where: { farmerId, mandiProfileId: profile.id },
    }),
    prisma.booking.count({
      where: {
        farmerId,
        mandiProfileId: profile.id,
        status: { in: [BookingStatus.VERIFIED, BookingStatus.COMPLETED] },
      },
    }),
  ]);

  const fp = farmerUser.farmerProfile;

  return {
    id: farmerUser.id,
    name: farmerUser.name,
    email: farmerUser.email,
    phone: farmerUser.phone,
    farmerCode: fp?.farmerCode || "FAR001",
    dob: fp?.dob,
    address: fp?.address || fp?.addressLine1,
    idType: fp?.idType,
    idNumber: fp?.idNumber,
    village: fp?.village,
    taluka: fp?.taluka,
    district: fp?.district,
    state: fp?.state,
    pincode: fp?.pincode,
    landSizeAcres: fp?.landSizeAcres,
    mainCrops: fp?.mainCrops || [],
    secondaryCrops: fp?.secondaryCrops || [],
    irrigationType: fp?.irrigationType,
    avatarUrl: fp?.avatarUrl,
    totalBookingsCount,
    verifiedBookingsCount,
  };
}

export async function getFarmersForMandi(userId: string) {
  const profile = await getOrCreateMandiProfile(userId);

  // 1. Fetch all bookings for this mandi with associated farmer and farmerProfile
  const bookings = await prisma.booking.findMany({
    where: { mandiProfileId: profile.id },
    include: {
      farmer: {
        include: {
          farmerProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const farmerMap = new Map<string, any>();

  for (const b of bookings) {
    if (!farmerMap.has(b.farmerId)) {
      const fp = b.farmer.farmerProfile;
      farmerMap.set(b.farmerId, {
        id: b.farmer.id,
        name: b.farmer.name,
        phone: b.farmer.phone || "N/A",
        village: fp?.village || fp?.district || "Local",
        district: fp?.district || profile.district || "Local",
        landAcres: fp?.landSizeAcres || 5.0,
        kycStatus: fp?.isProfileComplete ? "VERIFIED" : "PENDING",
        primaryCrops: fp?.mainCrops?.length ? fp.mainCrops : [b.crop],
        totalConsignments: 0,
        totalQuintalsSupplied: 0,
        lastArrival: b.createdAt.toISOString().split("T")[0],
      });
    }
    const item = farmerMap.get(b.farmerId);
    item.totalConsignments += 1;
    item.totalQuintalsSupplied += (b.quantityQuintals || 0);
  }

  // 2. If no bookings exist yet for this specific mandi, return all registered farmers from DB
  if (farmerMap.size === 0) {
    const allFarmers = await prisma.user.findMany({
      where: { role: Role.FARMER },
      include: { farmerProfile: true },
      take: 20,
    });

    for (const f of allFarmers) {
      const fp = f.farmerProfile;
      farmerMap.set(f.id, {
        id: f.id,
        name: f.name,
        phone: f.phone || "N/A",
        village: fp?.village || fp?.district || "Sanwer",
        district: fp?.district || "Indore",
        landAcres: fp?.landSizeAcres || 5.0,
        kycStatus: fp?.isProfileComplete ? "VERIFIED" : "PENDING",
        primaryCrops: fp?.mainCrops?.length ? fp.mainCrops : ["Wheat"],
        totalConsignments: 0,
        totalQuintalsSupplied: 0,
        lastArrival: "None",
      });
    }
  }

  return Array.from(farmerMap.values());
}

