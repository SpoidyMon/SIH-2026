import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";
import { prisma } from "../src/lib/prisma.js";
import { Role } from "@prisma/client";

// Mock Prisma
vi.mock("../src/lib/prisma.js", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    mandiProfile: {
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      update: vi.fn(),
    },
    mandiSlot: {
      findMany: vi.fn(),
    },
    booking: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe("Role-Based Access Control (RBAC) Suite", () => {
  const farmerToken = generateAccessToken({
    userId: "farmer-user-1",
    email: "farmer@test.com",
    role: Role.FARMER,
    isVerified: true,
  });

  const mandiToken = generateAccessToken({
    userId: "mandi-user-2",
    email: "mandi@test.com",
    role: Role.MANDI_OPERATOR,
    isVerified: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Protected Farmer Endpoints (/api/v1/farmer/*)", () => {
    it("should allow FARMER role to access farmer dashboard", async () => {
      const response = await request(app)
        .get("/api/v1/farmer/dashboard")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("FARMER");
    });

    it("should reject MANDI_OPERATOR role with 403 Forbidden on farmer dashboard", async () => {
      const response = await request(app)
        .get("/api/v1/farmer/dashboard")
        .set("Authorization", `Bearer ${mandiToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("FORBIDDEN_ROLE");
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const response = await request(app).get("/api/v1/farmer/dashboard");

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Protected Mandi Operator Endpoints (/api/v1/mandi/*)", () => {
    it("should allow MANDI_OPERATOR role to access mandi dashboard", async () => {
      vi.mocked(prisma.mandiProfile.findUnique).mockResolvedValue({
        id: "profile_1",
        userId: "mandi-user-2",
        mandiName: "Mandi Yard",
        mandiCode: "MAN001",
        apmcCode: "APMC-001",
        rating: 4.8,
        totalReviews: 10,
        approvalStatus: "APPROVED",
        legalDocs: [],
      } as any);
      vi.mocked(prisma.mandiSlot.findMany).mockResolvedValue([]);
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/mandi/dashboard")
        .set("Authorization", `Bearer ${mandiToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("MANDI_OPERATOR");
    });

    it("should reject FARMER role with 403 Forbidden on mandi dashboard", async () => {
      const response = await request(app)
        .get("/api/v1/mandi/dashboard")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("FORBIDDEN_ROLE");
    });
  });

  describe("Session & Profile Endpoint (/api/v1/auth/me)", () => {
    it("should return profile of authenticated user", async () => {
      const mockProfile = {
        id: "farmer-user-1",
        name: "Farmer John",
        email: "farmer@test.com",
        phone: "+919876543210",
        role: Role.FARMER,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockProfile);

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("farmer@test.com");
      expect(response.body.data.user.role).toBe("FARMER");
    });

    it("should reject unauthenticated request to /auth/me with 401", async () => {
      const response = await request(app).get("/api/v1/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });
  });
});
