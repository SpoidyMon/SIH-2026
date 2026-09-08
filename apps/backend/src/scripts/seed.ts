import { prisma } from "../lib/prisma.js";
import { Role, MandiApprovalStatus, LegalDocType } from "@prisma/client";
import { hashPassword } from "../utils/password.js";

async function main() {
  console.log("🌱 Cleaning and seeding test accounts into PostgreSQL...");

  const testEmails = [
    "mandi.approved@agrimarket.gov.in",
    "mandi.pending@agrimarket.gov.in",
    "mandi.new@agrimarket.gov.in",
    "admin@agrimarket.gov.in",
    "new.mandi@agrimarket.gov.in",
    "farmer.test@agrimarket.gov.in",
  ];

  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  await prisma.farmerProfile.deleteMany({
    where: { farmerCode: "FAR001" },
  });

  const passwordHash = await hashPassword("Password@123");

  // ----------------------------------------------------
  // 1. APPROVED MANDI OPERATOR (Full operational access)
  // ----------------------------------------------------
  const approvedUser = await prisma.user.create({
    data: {
      name: "Rupesh Sharma",
      email: "mandi.approved@agrimarket.gov.in",
      phone: "+919826012345",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  const approvedProfile = await prisma.mandiProfile.create({
    data: {
      userId: approvedUser.id,
      mandiName: "Indore APMC Central Grain Yard",
      mandiCode: "MAN001",
      apmcCode: "APMC-IND-MP-042",
      address: "Plot No. 44, Industrial Area, Bypass Highway",
      pincode: "452010",
      district: "Indore",
      state: "Madhya Pradesh",
      operatingHours: "07:30 AM - 06:00 PM (Mon-Sat)",
      closedDays: ["Sunday"],
      closedHours: "01:00 PM - 02:00 PM (Lunch Break)",
      isLocationSet: true,
      latitude: 22.7196,
      longitude: 75.8577,
      topCrop: "Wheat (Sharbati) & Mustard",
      acceptedCrops: ["Wheat (Sharbati)", "Mustard (Sarson)", "Soybean (Yellow)", "Tomato", "Onion"],
      aadhaarNumber: "5412 8901 2345",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.8,
      totalReviews: 142,
    },
  });

  // Seed sample slots for approved mandi
  const todayStr = new Date().toISOString().split("T")[0] || "2026-09-08";
  const slot1 = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: approvedProfile.id,
      crop: "Wheat (Sharbati)",
      allowedCrops: [
        { crop: "Wheat (Sharbati)", quantityQuintals: 500, isFixed: true },
        { crop: "Tomato", quantityQuintals: 100, isFixed: true },
        { crop: "Onion", isFixed: false },
      ],
      date: todayStr,
      startTime: "08:00",
      endTime: "11:30",
      totalCapacityQuintals: 500,
      bookedCapacityQuintals: 245,
      capacityPercentage: 49.0,
      maxFarmers: 20,
      bookedFarmers: 6,
      availableBookings: 14,
      bufferMinutes: 15,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  await prisma.mandiSlot.create({
    data: {
      mandiProfileId: approvedProfile.id,
      crop: "Mustard (Sarson)",
      allowedCrops: [
        { crop: "Mustard (Sarson)", quantityQuintals: 400, isFixed: true },
        { crop: "Soybean (Yellow)", isFixed: false },
      ],
      date: todayStr,
      startTime: "12:00",
      endTime: "15:30",
      totalCapacityQuintals: 400,
      bookedCapacityQuintals: 160,
      capacityPercentage: 40.0,
      maxFarmers: 16,
      bookedFarmers: 4,
      availableBookings: 12,
      bufferMinutes: 20,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  // Seed Test Farmer and Bookings
  const testFarmer = await prisma.user.create({
    data: {
      name: "Rameshwar Dhakad",
      email: "farmer.test@agrimarket.gov.in",
      phone: "+919893011223",
      passwordHash,
      role: Role.FARMER,
      isVerified: true,
      farmerProfile: {
        create: {
          farmerCode: "FAR001",
          dob: "1982-05-14",
          address: "Village Sanwer, Tehsil Sanwer, Indore",
          addressLine1: "House 24, Near Gram Panchayat",
          village: "Sanwer",
          taluka: "Sanwer",
          district: "Indore",
          state: "Madhya Pradesh",
          pincode: "453551",
          idType: "AADHAAR",
          idNumber: "9123 4567 8901",
          isProfileComplete: true,
          landSizeAcres: 8.5,
          mainCrops: ["Wheat", "Soybean"],
          secondaryCrops: ["Mustard", "Gram"],
          irrigationType: "Drip & Tube-well",
        },
      },
    },
  });

  // Seed sample queue bookings for First-Come First-Served demonstration
  await prisma.booking.createMany({
    data: [
      {
        token: "8SEP-10AM-001",
        queueNumber: 1,
        farmerId: testFarmer.id,
        mandiProfileId: approvedProfile.id,
        slotId: slot1.id,
        crop: "Wheat (Sharbati)",
        variety: "Sharbati Gold",
        quantityQuintals: 45,
        vehicleNumber: "MP-09-AB-4821",
        qrCodeData: "https://agrovia.gov.in/verify?tkn=8SEP-10AM-001",
        status: "PENDING",
      },
      {
        token: "8SEP-10AM-002",
        queueNumber: 2,
        farmerId: testFarmer.id,
        mandiProfileId: approvedProfile.id,
        slotId: slot1.id,
        crop: "Tomato",
        variety: "Hybrid Red",
        quantityQuintals: 10,
        vehicleNumber: "MP-09-CX-1934",
        qrCodeData: "https://agrovia.gov.in/verify?tkn=8SEP-10AM-002",
        status: "PENDING",
      },
    ],
  });

  // ----------------------------------------------------
  // 2. PENDING APPROVAL MANDI (Submitted KYC, awaiting admin approval)
  // ----------------------------------------------------
  const pendingUser = await prisma.user.create({
    data: {
      name: "Vikram Patel",
      email: "mandi.pending@agrimarket.gov.in",
      phone: "+919876543211",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  const pendingProfile = await prisma.mandiProfile.create({
    data: {
      userId: pendingUser.id,
      mandiName: "Ujjain Krishi Upaj Mandi Yard",
      apmcCode: "APMC-UJJ-MP-019",
      address: "Agar Rd, Industrial Area",
      district: "Ujjain",
      state: "Madhya Pradesh",
      operatingHours: "08:00 AM - 06:00 PM (Mon-Sat)",
      aadhaarNumber: "8912 3456 7890",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.PENDING_APPROVAL,
    },
  });

  await prisma.mandiLegalDoc.createMany({
    data: [
      {
        mandiProfileId: pendingProfile.id,
        name: "Ujjain APMC Mandi License 2026",
        type: LegalDocType.MANDI_LICENSE,
        status: "PENDING",
        fileUrl: "https://vault.agrimarket.gov.in/docs/ujjain_license.pdf",
      },
      {
        mandiProfileId: pendingProfile.id,
        name: "MP State Mandi Board Registration",
        type: LegalDocType.APMC_REGISTRATION,
        status: "PENDING",
        fileUrl: "https://vault.agrimarket.gov.in/docs/ujjain_board_reg.pdf",
      },
    ],
  });

  // ----------------------------------------------------
  // 3. FRESH / UN-ONBOARDED MANDI (Needs to fill KYC in Settings)
  // ----------------------------------------------------
  const newUser = await prisma.user.create({
    data: {
      name: "Amit Deshmukh",
      email: "mandi.new@agrimarket.gov.in",
      phone: "+919811122233",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  await prisma.mandiProfile.create({
    data: {
      userId: newUser.id,
      mandiName: null,
      apmcCode: null,
      address: null,
      district: null,
      state: null,
      aadhaarNumber: null,
      aadhaarVerified: false,
      approvalStatus: MandiApprovalStatus.PENDING_ONBOARDING,
    },
  });

  // ----------------------------------------------------
  // 4. PLATFORM ADMINISTRATOR (Can verify and approve)
  // ----------------------------------------------------
  await prisma.user.create({
    data: {
      name: "Platform Administrator",
      email: "admin@agrimarket.gov.in",
      phone: "+919999900000",
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  console.log("✅ All test accounts seeded into PostgreSQL successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
