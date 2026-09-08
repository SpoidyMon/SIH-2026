import { prisma } from "../lib/prisma.js";
import { Role, MandiApprovalStatus, LegalDocType, DocVerificationStatus, BookingStatus } from "@prisma/client";
import { hashPassword } from "../utils/password.js";

async function main() {
  const email = "collegeacc777@gmail.com";
  const plaintextPassword = "rahul@123";

  console.log(`🚀 Creating/updating Mandi Operator account for: ${email}...`);

  const passwordHash = await hashPassword(plaintextPassword);

  // 1. Create or update User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Warren P. (Chief Mandi Officer)",
      phone: "+919876543777",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
    create: {
      email,
      name: "Warren P. (Chief Mandi Officer)",
      phone: "+919876543777",
      passwordHash,
      role: Role.MANDI_OPERATOR,
      isVerified: true,
    },
  });

  console.log(`✅ User record ready with ID: ${user.id}`);

  // 2. Create or update MandiProfile
  const mandiProfile = await prisma.mandiProfile.upsert({
    where: { userId: user.id },
    update: {
      mandiName: "APMC Indore Central — Yard B",
      apmcCode: "APMC-IND-MP-777",
      address: "Industrial Yard Sector 4, Bypass Highway, Indore Central",
      district: "Indore",
      state: "Madhya Pradesh",
      operatingHours: "07:30 AM - 06:00 PM (Mon-Sat)",
      topCrop: "Wheat & Mustard",
      acceptedCrops: ["Wheat (Sharbati)", "Mustard (Black Bold)", "Rice (Basmati)", "Soyabean (Yellow)"],
      modalPrice: "₹2,450 / qtl",
      priceTrend: "+₹75 today",
      trendDirection: "up",
      estimatedQueueTime: "18 mins wait",
      activeFarmersCount: 142,
      isOpen: true,
      aadhaarNumber: "5412 8901 7777",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.8,
      totalReviews: 84,
    },
    create: {
      userId: user.id,
      mandiName: "APMC Indore Central — Yard B",
      apmcCode: "APMC-IND-MP-777",
      address: "Industrial Yard Sector 4, Bypass Highway, Indore Central",
      district: "Indore",
      state: "Madhya Pradesh",
      operatingHours: "07:30 AM - 06:00 PM (Mon-Sat)",
      topCrop: "Wheat & Mustard",
      acceptedCrops: ["Wheat (Sharbati)", "Mustard (Black Bold)", "Rice (Basmati)", "Soyabean (Yellow)"],
      modalPrice: "₹2,450 / qtl",
      priceTrend: "+₹75 today",
      trendDirection: "up",
      estimatedQueueTime: "18 mins wait",
      activeFarmersCount: 142,
      isOpen: true,
      aadhaarNumber: "5412 8901 7777",
      aadhaarVerified: true,
      approvalStatus: MandiApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rating: 4.8,
      totalReviews: 84,
    },
  });

  console.log(`✅ MandiProfile ready with ID: ${mandiProfile.id}`);

  // 3. Clear existing slots/bookings to avoid duplicates on re-run
  await prisma.booking.deleteMany({ where: { mandiProfileId: mandiProfile.id } });
  await prisma.mandiSlot.deleteMany({ where: { mandiProfileId: mandiProfile.id } });
  await prisma.mandiLegalDoc.deleteMany({ where: { mandiProfileId: mandiProfile.id } });

  // 4. Create active Mandi Slots
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const slot1 = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: mandiProfile.id,
      crop: "Wheat (Sharbati)",
      date: todayStr,
      startTime: "08:00",
      endTime: "11:30",
      totalCapacityQuintals: 600,
      bookedCapacityQuintals: 380,
      capacityPercentage: 63.3,
      maxFarmers: 25,
      bookedFarmers: 15,
      availableBookings: 10,
      bufferMinutes: 15,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  const slot2 = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: mandiProfile.id,
      crop: "Mustard (Black Bold)",
      date: todayStr,
      startTime: "12:00",
      endTime: "15:30",
      totalCapacityQuintals: 400,
      bookedCapacityQuintals: 160,
      capacityPercentage: 40.0,
      maxFarmers: 18,
      bookedFarmers: 6,
      availableBookings: 12,
      bufferMinutes: 20,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  const slot3 = await prisma.mandiSlot.create({
    data: {
      mandiProfileId: mandiProfile.id,
      crop: "Rice (Basmati 1121)",
      date: tomorrowStr,
      startTime: "09:00",
      endTime: "13:00",
      totalCapacityQuintals: 500,
      bookedCapacityQuintals: 240,
      capacityPercentage: 48.0,
      maxFarmers: 20,
      bookedFarmers: 8,
      availableBookings: 12,
      bufferMinutes: 15,
      bufferPercentage: 10,
      isActive: true,
    },
  });

  console.log(`✅ Mandi arrival slots created`);

  // 5. Ensure demo farmer users exist for bookings
  const demoFarmer = await prisma.user.upsert({
    where: { email: "farmer.demo@agrimarket.gov.in" },
    update: {},
    create: {
      email: "farmer.demo@agrimarket.gov.in",
      name: "Baldev Singh",
      phone: "+919876543210",
      passwordHash,
      role: Role.FARMER,
      isVerified: true,
    },
  });

  const demoFarmer2 = await prisma.user.upsert({
    where: { email: "farmer2.demo@agrimarket.gov.in" },
    update: {},
    create: {
      email: "farmer2.demo@agrimarket.gov.in",
      name: "Ramesh Patel",
      phone: "+919425011223",
      passwordHash,
      role: Role.FARMER,
      isVerified: true,
    },
  });

  // 6. Seed sample bookings
  await prisma.booking.createMany({
    data: [
      {
        token: "TKN-7821",
        farmerId: demoFarmer.id,
        mandiProfileId: mandiProfile.id,
        slotId: slot1.id,
        crop: "Wheat",
        variety: "Sharbati (Grade-A)",
        quantityQuintals: 45,
        capacityPercentage: 9,
        vehicleNumber: "MP-09-AB-1234",
        status: BookingStatus.PENDING,
      },
      {
        token: "TKN-3190",
        farmerId: demoFarmer2.id,
        mandiProfileId: mandiProfile.id,
        slotId: slot1.id,
        crop: "Mustard",
        variety: "Black Bold (Grade-B)",
        quantityQuintals: 60,
        capacityPercentage: 12,
        vehicleNumber: "MP-09-XY-5678",
        status: BookingStatus.ACCEPTED,
      },
      {
        token: "TKN-1092",
        farmerId: demoFarmer.id,
        mandiProfileId: mandiProfile.id,
        slotId: slot2.id,
        crop: "Rice",
        variety: "Basmati 1121 Premium",
        quantityQuintals: 80,
        capacityPercentage: 16,
        vehicleNumber: "MP-09-CD-9012",
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
      {
        token: "TKN-1088",
        farmerId: demoFarmer2.id,
        mandiProfileId: mandiProfile.id,
        slotId: slot2.id,
        crop: "Wheat",
        variety: "Lokwan",
        quantityQuintals: 55,
        capacityPercentage: 11,
        vehicleNumber: "MP-09-EF-3456",
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
    ],
  });

  console.log(`✅ Sample consignment bookings created`);

  // 7. Seed legal documents
  await prisma.mandiLegalDoc.createMany({
    data: [
      {
        mandiProfileId: mandiProfile.id,
        name: "Indore Central APMC Trading License",
        type: LegalDocType.MANDI_LICENSE,
        status: DocVerificationStatus.VERIFIED,
        fileUrl: "https://vault.agrimarket.gov.in/docs/apmc_indore_777_license.pdf",
      },
      {
        mandiProfileId: mandiProfile.id,
        name: "State Mandi Board Accreditation Gazette",
        type: LegalDocType.APMC_REGISTRATION,
        status: DocVerificationStatus.VERIFIED,
        fileUrl: "https://vault.agrimarket.gov.in/docs/apmc_indore_777_gazette.pdf",
      },
      {
        mandiProfileId: mandiProfile.id,
        name: "GST Exemption & Registered APMC Entity Certificate",
        type: LegalDocType.GST_CERTIFICATE,
        status: DocVerificationStatus.VERIFIED,
        fileUrl: "https://vault.agrimarket.gov.in/docs/apmc_indore_777_gst.pdf",
      },
    ],
  });

  console.log(`🎉 Account successfully created!`);
  console.log(`----------------------------------------`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${plaintextPassword}`);
  console.log(`Role:     ${user.role}`);
  console.log(`Status:   Verified & Approved Mandi Operator`);
  console.log(`Mandi:    ${mandiProfile.mandiName} (${mandiProfile.apmcCode})`);
  console.log(`----------------------------------------`);
}

main()
  .catch((e) => {
    console.error("❌ Error creating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
