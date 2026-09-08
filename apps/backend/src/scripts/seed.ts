import { prisma } from "../lib/prisma.js";
import { Role, MandiApprovalStatus, LegalDocType } from "@prisma/client";
import { hashPassword } from "../utils/password.js";

async function main() {
  console.log("🌱 Cleaning and seeding realistic production-grade data into PostgreSQL...");

  const testEmails = [
    "mandi.approved@agrimarket.gov.in",
    "pune.mandi@agrimarket.gov.in",
    "nashik.mandi@agrimarket.gov.in",
    "mandi.pending@agrimarket.gov.in",
    "mandi.new@agrimarket.gov.in",
    "admin@agrimarket.gov.in",
    "new.mandi@agrimarket.gov.in",
    "farmer.test@agrimarket.gov.in",
    "baldev.singh@agrimarket.gov.in",
    "harpreet.kaur@agrimarket.gov.in",
  ];

  await prisma.booking.deleteMany({
    where: { token: { startsWith: "8SEP" } },
  });

  await prisma.mandiProfile.deleteMany({
    where: { mandiCode: { in: ["MAN001", "MAN002", "MAN003"] } },
  });

  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  await prisma.farmerProfile.deleteMany({
    where: { farmerCode: { in: ["FAR001", "FAR002", "FAR003"] } },
  });

  const passwordHash = await hashPassword("Password@123");

  // ----------------------------------------------------
  // 1. STANDARD COMMODITIES
  // ----------------------------------------------------
  const commodities = [
    { name: "Wheat (Sharbati)", category: "Cereals", defaultUnit: "quintal" },
    { name: "Mustard (Sarson)", category: "Oilseeds", defaultUnit: "quintal" },
    { name: "Soybean (Yellow)", category: "Oilseeds", defaultUnit: "quintal" },
    { name: "Onion (Red)", category: "Vegetables", defaultUnit: "quintal" },
    { name: "Tomato", category: "Vegetables", defaultUnit: "quintal" },
    { name: "Basmati Rice (1121)", category: "Cereals", defaultUnit: "quintal" },
    { name: "Cotton", category: "Cash Crops", defaultUnit: "quintal" },
    { name: "Potato", category: "Vegetables", defaultUnit: "quintal" },
    { name: "Gram (Chana)", category: "Pulses", defaultUnit: "quintal" },
    { name: "Maize", category: "Cereals", defaultUnit: "quintal" },
  ];

  for (const comm of commodities) {
    await prisma.commodity.upsert({
      where: { name: comm.name },
      update: { category: comm.category, defaultUnit: comm.defaultUnit },
      create: comm,
    });
  }

  // ----------------------------------------------------
  // 2. APPROVED MANDI OPERATOR 1 (Indore Central)
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
      acceptedCrops: ["Wheat (Sharbati)", "Mustard (Sarson)", "Soybean (Yellow)", "Tomato", "Onion (Red)"],
      modalPrice: "₹2,750 / qtl",
      priceTrend: "+₹140 today",
      trendDirection: "up",
      estimatedQueueTime: "20 mins wait",
      activeFarmersCount: 142,
      aadhaarNumber: "5412 8901 2345",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.8,
      totalReviews: 142,
    },
  });

  // Slots for Mandi 1
  const todayStr = new Date().toISOString().split("T")[0] || "2026-09-08";
  const slot1 = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: approvedProfile.id,
      crop: "Wheat (Sharbati)",
      allowedCrops: [
        { crop: "Wheat (Sharbati)", quantityQuintals: 500, isFixed: true },
        { crop: "Tomato", quantityQuintals: 100, isFixed: true },
        { crop: "Onion (Red)", isFixed: false },
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

  const slot2 = await prisma.mandiSlot.create({
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

  // ----------------------------------------------------
  // 3. APPROVED MANDI OPERATOR 2 (Pune Gultekdi Yard)
  // ----------------------------------------------------
  const puneUser = await prisma.user.create({
    data: {
      name: "Nitin Kadam",
      email: "pune.mandi@agrimarket.gov.in",
      phone: "+919822019988",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  const puneProfile = await prisma.mandiProfile.create({
    data: {
      userId: puneUser.id,
      mandiName: "Gultekdi Pune APMC Main Yard",
      mandiCode: "MAN002",
      apmcCode: "APMC-PUN-MH-011",
      address: "Market Yard Road, Gultekdi",
      pincode: "411037",
      district: "Pune",
      state: "Maharashtra",
      operatingHours: "06:00 AM - 05:00 PM (Mon-Sat)",
      closedDays: ["Sunday"],
      closedHours: "01:00 PM - 02:00 PM",
      isLocationSet: true,
      latitude: 18.4965,
      longitude: 73.8656,
      topCrop: "Onion (Red) & Tomato",
      acceptedCrops: ["Onion (Red)", "Tomato", "Soybean (Yellow)", "Wheat (Sharbati)"],
      modalPrice: "₹2,890 / qtl",
      priceTrend: "+₹80 today",
      trendDirection: "up",
      estimatedQueueTime: "15 mins wait",
      activeFarmersCount: 168,
      aadhaarNumber: "7821 4401 9912",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.7,
      totalReviews: 98,
    },
  });

  await prisma.mandiSlot.create({
    data: {
      mandiProfileId: puneProfile.id,
      crop: "Onion (Red)",
      allowedCrops: [
        { crop: "Onion (Red)", quantityQuintals: 600, isFixed: true },
        { crop: "Tomato", quantityQuintals: 200, isFixed: true },
      ],
      date: todayStr,
      startTime: "07:00",
      endTime: "11:00",
      totalCapacityQuintals: 600,
      bookedCapacityQuintals: 150,
      capacityPercentage: 25.0,
      maxFarmers: 25,
      bookedFarmers: 5,
      availableBookings: 20,
      bufferMinutes: 15,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  // ----------------------------------------------------
  // 4. APPROVED MANDI OPERATOR 3 (Nashik APMC Yard)
  // ----------------------------------------------------
  const nashikUser = await prisma.user.create({
    data: {
      name: "Sanjay Jagtap",
      email: "nashik.mandi@agrimarket.gov.in",
      phone: "+919823055443",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  await prisma.mandiProfile.create({
    data: {
      userId: nashikUser.id,
      mandiName: "Nashik APMC Main Market Yard",
      mandiCode: "MAN003",
      apmcCode: "APMC-NSK-MH-008",
      address: "Panchavati Market Yard, Mumbai-Agra Highway",
      pincode: "422003",
      district: "Nashik",
      state: "Maharashtra",
      operatingHours: "06:30 AM - 06:30 PM (Mon-Sat)",
      closedDays: ["Sunday"],
      isLocationSet: true,
      latitude: 19.9975,
      longitude: 73.7898,
      topCrop: "Onion (Red) & Grapes",
      acceptedCrops: ["Onion (Red)", "Tomato", "Soybean (Yellow)"],
      modalPrice: "₹2,680 / qtl",
      priceTrend: "+₹120 today",
      trendDirection: "up",
      estimatedQueueTime: "25 mins wait",
      activeFarmersCount: 190,
      aadhaarNumber: "4521 8901 3321",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.9,
      totalReviews: 215,
    },
  });

  // ----------------------------------------------------
  // 5. REGISTERED FARMERS WITH VERIFIED PROFILES
  // ----------------------------------------------------
  const farmer1 = await prisma.user.create({
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
          mainCrops: ["Wheat (Sharbati)", "Soybean (Yellow)"],
          secondaryCrops: ["Mustard (Sarson)", "Gram (Chana)"],
          irrigationType: "Drip & Tube-well",
        },
      },
    },
  });

  const farmer2 = await prisma.user.create({
    data: {
      name: "Baldev Singh",
      email: "baldev.singh@agrimarket.gov.in",
      phone: "+919876543210",
      passwordHash,
      role: Role.FARMER,
      isVerified: true,
      farmerProfile: {
        create: {
          farmerCode: "FAR002",
          dob: "1978-08-22",
          address: "Village Baramati, District Pune",
          addressLine1: "Plot 12, Agro Green Zone",
          village: "Baramati",
          taluka: "Baramati",
          district: "Pune",
          state: "Maharashtra",
          pincode: "413102",
          idType: "AADHAAR",
          idNumber: "8412 9012 3456",
          isProfileComplete: true,
          landSizeAcres: 14.0,
          mainCrops: ["Onion (Red)", "Tomato"],
          secondaryCrops: ["Soybean (Yellow)"],
          irrigationType: "Canal & Well",
        },
      },
    },
  });

  const farmer3 = await prisma.user.create({
    data: {
      name: "Harpreet Kaur",
      email: "harpreet.kaur@agrimarket.gov.in",
      phone: "+919814077889",
      passwordHash,
      role: Role.FARMER,
      isVerified: true,
      farmerProfile: {
        create: {
          farmerCode: "FAR003",
          dob: "1985-11-03",
          address: "Village Niphad, District Nashik",
          addressLine1: "Kisan Colony Road",
          village: "Niphad",
          taluka: "Niphad",
          district: "Nashik",
          state: "Maharashtra",
          pincode: "422303",
          idType: "AADHAAR",
          idNumber: "6512 3412 8821",
          isProfileComplete: true,
          landSizeAcres: 18.5,
          mainCrops: ["Onion (Red)", "Wheat (Sharbati)"],
          secondaryCrops: ["Mustard (Sarson)"],
          irrigationType: "Drip Irrigation",
        },
      },
    },
  });

  // ----------------------------------------------------
  // 6. REAL BOOKINGS & FCFS ARRIVAL QUEUES
  // ----------------------------------------------------
  await prisma.booking.createMany({
    data: [
      {
        token: "8SEP-10AM-001",
        queueNumber: 1,
        farmerId: farmer1.id,
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
        farmerId: farmer2.id,
        mandiProfileId: approvedProfile.id,
        slotId: slot1.id,
        crop: "Tomato",
        variety: "Hybrid Red",
        quantityQuintals: 30,
        vehicleNumber: "MP-09-CX-1934",
        qrCodeData: "https://agrovia.gov.in/verify?tkn=8SEP-10AM-002",
        status: "ACCEPTED",
      },
      {
        token: "8SEP-10AM-003",
        queueNumber: 3,
        farmerId: farmer3.id,
        mandiProfileId: approvedProfile.id,
        slotId: slot2.id,
        crop: "Mustard (Sarson)",
        variety: "Grade-A Certified",
        quantityQuintals: 50,
        vehicleNumber: "MH-15-DK-9042",
        qrCodeData: "https://agrovia.gov.in/verify?tkn=8SEP-10AM-003",
        status: "VERIFIED",
      },
      {
        token: "8SEP-10AM-004",
        queueNumber: 4,
        farmerId: farmer1.id,
        mandiProfileId: approvedProfile.id,
        slotId: slot2.id,
        crop: "Soybean (Yellow)",
        variety: "JS-335 Organic",
        quantityQuintals: 65,
        vehicleNumber: "MP-09-EA-7711",
        qrCodeData: "https://agrovia.gov.in/verify?tkn=8SEP-10AM-004",
        status: "COMPLETED",
        servedAt: new Date(),
      },
    ],
  });

  // ----------------------------------------------------
  // 7. PENDING APPROVAL MANDI
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
  // 8. FRESH / UN-ONBOARDED MANDI
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
  // 9. PLATFORM ADMINISTRATOR
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

  console.log("✅ All realistic production seed data loaded into PostgreSQL successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
