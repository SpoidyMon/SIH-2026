import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { generateAccessToken } from "../src/utils/jwt.js";
import { Role, BookingStatus, MandiApprovalStatus, LegalDocType } from "@prisma/client";

// Mock Prisma
vi.mock("../src/lib/prisma.js", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mandiProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      update: vi.fn(),
    },
    mandiSlot: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    mandiLegalDoc: {
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe("Mandi Module Backend Suite", () => {
  const mockMandiOperator = {
    userId: "mandi_op_123",
    email: "operator@agrimarket.gov.in",
    role: Role.MANDI_OPERATOR,
    isVerified: true,
  };

  const mockFarmer = {
    userId: "farmer_123",
    email: "farmer@agrimarket.gov.in",
    role: Role.FARMER,
    isVerified: true,
  };

  const mockAdmin = {
    userId: "admin_123",
    email: "admin@agrimarket.gov.in",
    role: Role.ADMIN,
    isVerified: true,
  };

  let mandiAccessToken: string;
  let farmerAccessToken: string;
  let adminAccessToken: string;

  const mockApprovedProfile = {
    id: "profile_123",
    userId: "mandi_op_123",
    mandiName: "Indore APMC Grain Yard",
    mandiCode: "MAN001",
    apmcCode: "APMC-IND-042",
    address: "Plot 44, Bypass Rd",
    district: "Indore",
    state: "Madhya Pradesh",
    operatingHours: "08:00 AM - 06:00 PM",
    aadhaarNumber: "•••• •••• 8912",
    aadhaarVerified: true,
    approvalStatus: MandiApprovalStatus.APPROVED,
    rating: 4.8,
    totalReviews: 142,
    legalDocs: [],
  };

  const mockPendingProfile = {
    ...mockApprovedProfile,
    id: "profile_pending_456",
    approvalStatus: MandiApprovalStatus.PENDING_APPROVAL,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mandiAccessToken = generateAccessToken(mockMandiOperator);
    farmerAccessToken = generateAccessToken(mockFarmer);
    adminAccessToken = generateAccessToken(mockAdmin);
  });

  describe("Role & Approval Policy Enforcement", () => {
    it("should deny access to Mandi endpoints if unauthenticated (401)", async () => {
      const res = await request(app).get("/api/v1/mandi/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should deny access to Mandi endpoints if user is a FARMER (403)", async () => {
      const res = await request(app)
        .get("/api/v1/mandi/dashboard")
        .set("Authorization", `Bearer ${farmerAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN_ROLE");
    });

    it("should reject operational slots access if Mandi is NOT APPROVED (403 MANDI_NOT_APPROVED)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockPendingProfile as any);

      const res = await request(app)
        .get("/api/v1/mandi/slots")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("MANDI_NOT_APPROVED");
      expect(res.body.data.approvalStatus).toBe("PENDING_APPROVAL");
    });

    it("should allow glance dashboard access with isApproved flag (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);
      vi.mocked(prisma.mandiSlot.findMany).mockResolvedValue([]);
      vi.mocked(prisma.booking.count).mockResolvedValue(0);

      const res = await request(app)
        .get("/api/v1/mandi/dashboard")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mandi.mandiName).toBe("Indore APMC Grain Yard");
      expect(res.body.data.mandi.isApproved).toBe(true);
    });
  });

  describe("Post-Login Onboarding & Admin Approval (/api/v1/mandi/onboarding, /admin/mandi/*)", () => {
    it("should allow authenticated Mandi operator to submit onboarding details (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue({
        id: "profile_new",
        userId: mockMandiOperator.userId,
        approvalStatus: MandiApprovalStatus.PENDING_ONBOARDING,
      } as any);
      vi.mocked(prisma.mandiProfile.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.mandiLegalDoc.createMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.mandiProfile.update).mockResolvedValue({
        id: "profile_new",
        mandiName: "Indore Grain APMC",
        apmcCode: "APMC-IND-99",
        approvalStatus: MandiApprovalStatus.PENDING_APPROVAL,
        updatedAt: new Date(),
      } as any);

      const onboardingPayload = {
        mandiName: "Indore Grain APMC",
        apmcCode: "APMC-IND-99",
        address: "Plot 44, Sector A",
        district: "Indore",
        state: "Madhya Pradesh",
        operatingHours: "08:00 AM - 06:00 PM",
        aadhaarNumber: "541289012345",
        legalDocs: [
          {
            name: "Mandi License",
            type: "MANDI_LICENSE",
            fileUrl: "https://vault.agrimarket.gov.in/docs/license.pdf",
          },
        ],
      };

      const res = await request(app)
        .post("/api/v1/mandi/onboarding")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send(onboardingPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe("PENDING_APPROVAL");
    });

    it("should allow ADMIN to approve pending Mandi (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue({
        id: "profile_pending_456",
        approvalStatus: MandiApprovalStatus.PENDING_APPROVAL,
      } as any);

      vi.mocked(prisma.mandiProfile.update).mockResolvedValue({
        id: "profile_pending_456",
        mandiName: "Indore Grain APMC",
        apmcCode: "APMC-IND-99",
        approvalStatus: MandiApprovalStatus.APPROVED,
        approvedAt: new Date(),
        user: { name: "Rupesh", email: "mandi@agri.gov.in", phone: "9876543210" },
      } as any);

      const res = await request(app)
        .patch("/api/v1/admin/mandi/profile_pending_456/approval-status")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe("APPROVED");
    });

    it("should reject non-admin users from admin approval endpoints (403)", async () => {
      const res = await request(app)
        .patch("/api/v1/admin/mandi/profile_pending_456/approval-status")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN_ROLE");
    });
  });

  describe("Arrival Slots Management (/api/v1/mandi/slots)", () => {
    it("should create a new arrival slot successfully (201)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const newSlotPayload = {
        crop: "Wheat (Sharbati)",
        date: "2026-08-31",
        startTime: "08:00",
        endTime: "11:30",
        totalCapacityQuintals: 500,
        maxFarmers: 20,
        bufferMinutes: 15,
        bufferPercentage: 10,
      };

      const createdSlot = {
        id: "slot_999",
        mandiProfileId: mockApprovedProfile.id,
        ...newSlotPayload,
        bookedCapacityQuintals: 0,
        capacityPercentage: 0,
        bookedFarmers: 0,
        availableBookings: 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.mandiSlot.create).mockResolvedValue(createdSlot as any);

      const res = await request(app)
        .post("/api/v1/mandi/slots")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send(newSlotPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slot.crop).toBe("Wheat (Sharbati)");
      expect(res.body.data.slot.totalCapacityQuintals).toBe(500);
    });

    it("should reject invalid slot creation payloads with validation error (400)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const invalidPayload = {
        crop: "W", // Too short
        date: "invalid-date",
        startTime: "8am", // Wrong format
      };

      const res = await request(app)
        .post("/api/v1/mandi/slots")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should list slots with query filters (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);
      vi.mocked(prisma.mandiSlot.findMany).mockResolvedValue([
        {
          id: "slot_101",
          mandiProfileId: mockApprovedProfile.id,
          crop: "Mustard",
          date: "2026-08-31",
          startTime: "09:00",
          endTime: "12:00",
          totalCapacityQuintals: 300,
          bookedCapacityQuintals: 150,
          capacityPercentage: 50,
          maxFarmers: 15,
          bookedFarmers: 5,
          availableBookings: 10,
          bufferMinutes: 15,
          bufferPercentage: 10,
          isActive: true,
        } as any,
      ]);

      const res = await request(app)
        .get("/api/v1/mandi/slots?crop=Mustard")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toHaveLength(1);
      expect(res.body.data.slots[0].crop).toBe("Mustard");
    });

    it("should delete a slot and cascade-cancel active bookings (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);
      vi.mocked(prisma.mandiSlot.findFirst).mockResolvedValue({ id: "slot_101", mandiProfileId: mockApprovedProfile.id } as any);
      vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.mandiSlot.delete).mockResolvedValue({ id: "slot_101" } as any);

      const res = await request(app)
        .delete("/api/v1/mandi/slots/slot_101")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.booking.updateMany).toHaveBeenCalled();
    });
  });

  describe("Bookings & QR Verification (/api/v1/mandi/bookings)", () => {
    it("should update booking status from PENDING to ACCEPTED (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const existingBooking = {
        id: "bk_101",
        mandiProfileId: mockApprovedProfile.id,
        status: BookingStatus.PENDING,
        notes: null,
      };

      vi.mocked(prisma.booking.findFirst).mockResolvedValue(existingBooking as any);
      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...existingBooking,
        status: BookingStatus.ACCEPTED,
        notes: "Gate 2 entry confirmed",
      } as any);

      const res = await request(app)
        .patch("/api/v1/mandi/bookings/bk_101/status")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({ status: "ACCEPTED", notes: "Gate 2 entry confirmed" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe("ACCEPTED");
    });

    it("should verify booking entry via Token scanner (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const mockFoundBooking = {
        id: "bk_101",
        token: "TKN-7821",
        mandiProfileId: mockApprovedProfile.id,
        crop: "Wheat",
        quantityQuintals: 45,
        status: BookingStatus.ACCEPTED,
        farmer: { name: "Baldev Singh", phone: "+91 98765 43210" },
        slot: { startTime: "08:00", endTime: "11:00", date: "2026-08-30" },
      };

      vi.mocked(prisma.booking.findFirst).mockResolvedValue(mockFoundBooking as any);
      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...mockFoundBooking,
        status: BookingStatus.VERIFIED,
        verifiedAt: new Date(),
      } as any);

      const res = await request(app)
        .post("/api/v1/mandi/bookings/verify")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({ token: "TKN-7821" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.token).toBe("TKN-7821");
      expect(res.body.data.booking.status).toBe("VERIFIED");
    });

    it("should complete weighing and mark transaction COMPLETED (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const existingBooking = {
        id: "bk_101",
        mandiProfileId: mockApprovedProfile.id,
        quantityQuintals: 45,
        status: BookingStatus.VERIFIED,
      };

      vi.mocked(prisma.booking.findFirst).mockResolvedValue(existingBooking as any);
      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...existingBooking,
        status: BookingStatus.COMPLETED,
        quantityQuintals: 44.8,
        completedAt: new Date(),
      } as any);

      const res = await request(app)
        .patch("/api/v1/mandi/bookings/bk_101/complete")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({ finalWeightQuintals: 44.8, notes: "Final payout voucher issued." });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe("COMPLETED");
    });
  });

  describe("Settings, KYC & Rating (/api/v1/mandi/profile, /kyc, /rating)", () => {
    it("should retrieve Mandi profile details (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique)
        .mockResolvedValueOnce(mockApprovedProfile as any)
        .mockResolvedValueOnce({
          ...mockApprovedProfile,
          user: { name: "Rupesh", email: "mandi@agrimarket.gov.in", phone: "+919826012345" },
        } as any);

      const res = await request(app)
        .get("/api/v1/mandi/profile")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.mandiName).toBe("Indore APMC Grain Yard");
    });

    it("should update Aadhaar KYC identification (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);
      vi.mocked(prisma.mandiProfile.update).mockResolvedValue({
        ...mockApprovedProfile,
        aadhaarNumber: "5412 8901 2345",
        aadhaarVerified: true,
      } as any);

      const res = await request(app)
        .post("/api/v1/mandi/kyc/aadhaar")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({ aadhaarNumber: "5412 8901 2345" });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.aadhaarVerified).toBe(true);
    });

    it("should upload statutory legal compliance document (201)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);
      vi.mocked(prisma.mandiLegalDoc.create).mockResolvedValue({
        id: "doc_101",
        mandiProfileId: mockApprovedProfile.id,
        name: "APMC Mandi Operating License 2026",
        type: LegalDocType.MANDI_LICENSE,
        status: "VERIFIED",
      } as any);

      const res = await request(app)
        .post("/api/v1/mandi/kyc/documents")
        .set("Authorization", `Bearer ${mandiAccessToken}`)
        .send({
          name: "APMC Mandi Operating License 2026",
          type: "MANDI_LICENSE",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.name).toBe("APMC Mandi Operating License 2026");
    });

    it("should retrieve farmer rating metrics (200)", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue(mockApprovedProfile as any);

      const res = await request(app)
        .get("/api/v1/mandi/rating")
        .set("Authorization", `Bearer ${mandiAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rating.rating).toBe(4.8);
      expect(res.body.data.rating.weighInPrecisionPercentage).toBe(99.2);
    });
  });
});
