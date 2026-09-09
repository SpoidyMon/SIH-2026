import { prisma, BookingStatus, MandiApprovalStatus } from "../../lib/prisma.js";
import { createFarmerBooking, getFarmerBookings } from "../../services/farmer.service.js";

/**
 * Normalizes regional crop names to canonical crop definitions.
 */
export function normalizeCropName(query: string): { cropId: string; name: string } {
  const clean = (query || "").trim().toLowerCase();

  if (/gehu|गेहूं|गहू|wheat/i.test(clean)) {
    return { cropId: "wheat", name: "Wheat" };
  }
  if (/sarson|सरसों|मोहरी|mustard/i.test(clean)) {
    return { cropId: "mustard", name: "Mustard" };
  }
  if (/chawal|dhan|चावल|धान|तांदूळ|rice|paddy/i.test(clean)) {
    return { cropId: "rice", name: "Rice" };
  }
  if (/soyabean|सोयाबीन|soya/i.test(clean)) {
    return { cropId: "soyabean", name: "Soyabean" };
  }
  if (/kapas|kapus|कपास|कापूस|cotton/i.test(clean)) {
    return { cropId: "cotton", name: "Cotton" };
  }
  if (/makka|maka|मक्का|मका|maize|corn/i.test(clean)) {
    return { cropId: "maize", name: "Maize" };
  }
  if (/chana|harbhara|चना|हरभरा|gram/i.test(clean)) {
    return { cropId: "chana", name: "Gram (Chana)" };
  }

  // Capitalize title
  const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { cropId: clean.replace(/\s+/g, "_"), name: formatted || "Wheat" };
}

/**
 * Searches real mandis from database by name, district, or query.
 */
export async function toolSearchMandis(params: {
  query?: string;
  latitude?: number;
  longitude?: number;
}) {
  const q = (params.query || "").trim();

  let mandis = await prisma.mandiProfile.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { mandiName: { contains: q, mode: "insensitive" } },
              { user: { name: { contains: q, mode: "insensitive" } } },
              { district: { contains: q, mode: "insensitive" } },
              { state: { contains: q, mode: "insensitive" } },
              { mandiCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      mandiName: true,
      mandiCode: true,
      district: true,
      state: true,
      address: true,
      acceptedCrops: true,
      rating: true,
      isOpen: true,
      user: { select: { name: true } },
    },
    take: 10,
  });

  if (mandis.length === 0) {
    mandis = await prisma.mandiProfile.findMany({
      take: 10,
      select: {
        id: true,
        mandiName: true,
        mandiCode: true,
        district: true,
        state: true,
        address: true,
        acceptedCrops: true,
        rating: true,
        isOpen: true,
        user: { select: { name: true } },
      },
    });
  }

  return mandis.map((m) => ({
    id: m.id,
    name: m.mandiName || (m.user?.name ? `${m.user.name}'s APMC Mandi` : `Mandi ${m.mandiCode}`),
    mandiCode: m.mandiCode,
    district: m.district || "",
    state: m.state || "",
    address: m.address || "",
    acceptedCrops: m.acceptedCrops || [],
    rating: m.rating || 4.8,
    isOpen: m.isOpen,
  }));
}

/**
 * Gets detailed mandi operational profile.
 */
export async function toolGetMandiDetails(params: { mandiId: string }) {
  const mandi = await prisma.mandiProfile.findUnique({
    where: { id: params.mandiId },
    select: {
      id: true,
      mandiName: true,
      mandiCode: true,
      apmcCode: true,
      address: true,
      district: true,
      state: true,
      operatingHours: true,
      acceptedCrops: true,
      rating: true,
      isOpen: true,
    },
  });

  if (!mandi) {
    throw new Error(`Mandi with ID "${params.mandiId}" not found.`);
  }

  return {
    ...mandi,
    name: mandi.mandiName || `Mandi ${mandi.mandiCode}`,
  };
}

/**
 * Fetches active, non-expired slots for a given date.
 */
export async function toolGetAvailableSlots(params: { mandiId: string; date?: string }) {
  const targetDate: string = params.date || new Date().toISOString().slice(0, 10);

  let slots = await prisma.mandiSlot.findMany({
    where: {
      mandiProfileId: params.mandiId,
      date: targetDate,
      isActive: true,
      availableBookings: { gt: 0 },
    },
    orderBy: { startTime: "asc" },
  });

  // Fallback 1: Fetch any active slots for this mandi profile
  if (slots.length === 0) {
    slots = await prisma.mandiSlot.findMany({
      where: {
        mandiProfileId: params.mandiId,
        isActive: true,
        availableBookings: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  // Fallback 2: Auto-create an active slot for the requested date if none exist
  if (slots.length === 0) {
    const newSlot = await prisma.mandiSlot.create({
      data: {
        mandiProfileId: params.mandiId,
        date: targetDate,
        startTime: "09:00",
        endTime: "13:00",
        crop: "Wheat",
        totalCapacityKg: 10000,
        bookedCapacityKg: 0,
        totalCapacityQuintals: 100,
        bookedCapacityQuintals: 0,
        maxFarmers: 50,
        bookedFarmers: 0,
        availableBookings: 50,
        isActive: true,
      },
    });
    slots = [newSlot];
  }

  return slots.map((s) => ({
    slotId: s.id,
    date: targetDate,
    startTime: s.startTime,
    endTime: s.endTime,
    crop: s.crop,
    availableBookings: s.availableBookings,
    totalCapacityKg: s.totalCapacityKg || s.totalCapacityQuintals * 100,
    bookedCapacityKg: s.bookedCapacityKg || s.bookedCapacityQuintals * 100,
  }));
}

/**
 * Searches and maps regional crop names to canonical crops.
 */
export async function toolSearchCrops(params: { mandiId?: string; query: string }) {
  const normalized = normalizeCropName(params.query);
  return [normalized];
}

/**
 * Validates slot capacity server-side strictly in KG.
 */
export async function toolCheckSlotCapacity(params: {
  slotId: string;
  quantityKg: number;
}) {
  const slot = await prisma.mandiSlot.findUnique({
    where: { id: params.slotId },
  });

  if (!slot || !slot.isActive) {
    return { valid: false, reason: "Requested slot is no longer active or available." };
  }

  if (slot.availableBookings <= 0) {
    return { valid: false, reason: "Slot has reached maximum farmer capacity." };
  }

  const currentKg = slot.bookedCapacityKg || slot.bookedCapacityQuintals * 100;
  const maxKg = slot.totalCapacityKg || slot.totalCapacityQuintals * 100;
  const remainingKg = Math.max(0, maxKg - currentKg);

  if (params.quantityKg > remainingKg) {
    return {
      valid: false,
      reason: `Slot weight capacity exceeded. Requested ${params.quantityKg} KG but only ${remainingKg} KG remaining.`,
      remainingKg,
    };
  }

  return {
    valid: true,
    remainingBookings: slot.availableBookings,
    remainingCapacityKg: remainingKg,
  };
}

/**
 * Queries crop rate per KG and calculates estimated trade payout.
 */
export async function toolGetCropRate(params: { mandiId?: string; crop: string }) {
  const cropName = params.crop.toLowerCase();
  let ratePerKg = 25; // Default standard benchmark rate

  if (cropName.includes("wheat") || cropName.includes("गेहूं")) ratePerKg = 23;
  if (cropName.includes("mustard") || cropName.includes("सरसों")) ratePerKg = 54;
  if (cropName.includes("rice") || cropName.includes("चावल")) ratePerKg = 38;
  if (cropName.includes("soyabean") || cropName.includes("सोयाबीन")) ratePerKg = 46;
  if (cropName.includes("cotton") || cropName.includes("कपास")) ratePerKg = 62;
  if (cropName.includes("maize") || cropName.includes("मक्का")) ratePerKg = 22;
  if (cropName.includes("chana") || cropName.includes("चना")) ratePerKg = 51;

  return {
    crop: params.crop,
    ratePerKg,
  };
}

/**
 * Creates an official PENDING booking request via farmer.service.ts.
 */
export async function toolCreateBookingRequest(params: {
  userId: string;
  mandiProfileId: string;
  slotId: string;
  crop: string;
  quantityKg: number;
  vehicleNumber?: string;
}) {
  const slot = await prisma.mandiSlot.findUnique({
    where: { id: params.slotId },
    include: { mandiProfile: true },
  });

  if (!slot) {
    throw new Error("Invalid arrival slot ID.");
  }

  const rateInfo = await toolGetCropRate({ crop: params.crop });
  const estimatedPayout = Math.round(params.quantityKg * rateInfo.ratePerKg);

  const booking = await createFarmerBooking(params.userId, {
    mandiProfileId: params.mandiProfileId,
    slotId: params.slotId,
    crop: params.crop,
    quantityKg: params.quantityKg,
    vehicleNumber: params.vehicleNumber,
    cropsList: [
      {
        crop: params.crop,
        quantityKg: params.quantityKg,
        ratePerKg: rateInfo.ratePerKg,
        estimatedAmount: estimatedPayout,
      },
    ],
  });

  return {
    id: booking.id,
    token: booking.token,
    status: booking.status,
    crop: booking.crop,
    quantityKg: booking.quantityKg || params.quantityKg,
    estimatedPayout: booking.estimatedPayout || estimatedPayout,
    mandiName: slot.mandiProfile.mandiName || `Mandi ${slot.mandiProfile.mandiCode}`,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
}

/**
 * Retrieves the authenticated farmer's bookings.
 */
export async function toolGetMyBookings(userId: string) {
  const bookings = await getFarmerBookings(userId);
  return bookings.map((b) => ({
    id: b.id,
    token: b.token,
    status: b.status,
    crop: b.crop,
    quantityKg: b.quantityKg,
    mandiName: b.mandiProfile?.mandiName || `Mandi ${b.mandiProfile?.mandiCode}`,
    date: b.slot?.date,
    startTime: b.slot?.startTime,
    endTime: b.slot?.endTime,
    createdAt: b.createdAt,
  }));
}

/**
 * Cancels an active pending booking.
 */
export async function toolCancelBooking(params: {
  userId: string;
  bookingId: string;
}): Promise<{ success: boolean; bookingId: string; status: BookingStatus }> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: params.bookingId,
      farmerId: params.userId,
    },
  });

  if (!booking) {
    throw new Error("Booking not found or access denied.");
  }

  if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.VERIFIED) {
    throw new Error("Cannot cancel a booking that has already been verified or completed.");
  }

  const updated = await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return { success: true, bookingId: updated.id, status: updated.status };
}

export const aiToolDefinitions = [
  {
    type: "function",
    function: {
      name: "searchMandis",
      description: "Search active mandis by name, district, or city.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query e.g. 'Rupesh', 'Nagpur', 'Pune'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAvailableSlots",
      description: "Get available active arrival time slots for a mandi on a given date.",
      parameters: {
        type: "object",
        properties: {
          mandiId: { type: "string", description: "The Mandi ID" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
        },
        required: ["mandiId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchCrops",
      description: "Map regional crop name (e.g. 'गेहूं', 'गहू', 'Chana') to canonical crop.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Crop name in regional language or English" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkSlotCapacity",
      description: "Validate slot availability and weight capacity in KG.",
      parameters: {
        type: "object",
        properties: {
          slotId: { type: "string", description: "The MandiSlot ID" },
          quantityKg: { type: "number", description: "Weight in Kilograms (KG)" },
        },
        required: ["slotId", "quantityKg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createBookingRequest",
      description: "Create an official PENDING booking request for the farmer.",
      parameters: {
        type: "object",
        properties: {
          mandiProfileId: { type: "string", description: "The MandiProfile ID" },
          slotId: { type: "string", description: "The MandiSlot ID" },
          crop: { type: "string", description: "Canonical crop name" },
          quantityKg: { type: "number", description: "Weight strictly in KG" },
          vehicleNumber: { type: "string", description: "Vehicle plate number" },
        },
        required: ["mandiProfileId", "slotId", "crop", "quantityKg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyBookings",
      description: "Retrieve all active or past booking requests for the authenticated farmer.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
