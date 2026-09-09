# Consolidated Project Context: SIH Agricultural Marketplace Platform (Version 3)

> **Document Version**: 3.0.0 (Master Project Context & Architectural Specification)  
> **Repository**: `SIH-2026` (`SpoidyMon/SIH-2026`)  
> **Last Updated**: September 2026  
> **Status**: Canonical Single Source of Truth  
> **Synthesized Modules**: Authentication & RBAC, APMC Mandi Operations (Backend & Frontend), Farmer Mobile App (`farmer-setu`), Multi-Language Localization (`en`, `mr`, `hi`), ImageKit Cloud Storage, Official 51 Commodities & Maharashtra Mandi Seed Clusters, Agrovia Landing Page & Design System.

---

## Table of Contents

1. [Executive Summary & Platform Mission](#1-executive-summary--platform-mission)
2. [Repository & Monorepo Architecture](#2-repository--monorepo-architecture)
3. [Core Engineering Principles & Coding Standards](#3-core-engineering-principles--coding-standards)
   - 3.1 [Strict Functional Programming Paradigm (Zero OOP/Classes)](#31-strict-functional-programming-paradigm-zero-oopclasses)
   - 3.2 [Type & Interface Management (Single Source of Truth)](#32-type--interface-management-single-source-of-truth)
   - 3.3 [Shared Database Pattern (`@repo/database`)](#33-shared-database-pattern-repodatabase)
   - 3.4 [Windows NTFS Compatibility & Git Sparse-Checkout](#34-windows-ntfs-compatibility--git-sparse-checkout)
   - 3.5 [Git Branching & Atomic Commit Rules](#35-git-branching--atomic-commit-rules)
   - 3.6 [Production Safeguards & Security Rules](#36-production-safeguards--security-rules)
4. [Shared Database Architecture (`packages/database`)](#4-shared-database-architecture-packagesdatabase)
   - 4.1 [Prisma Schema Specification & Relational Models](#41-prisma-schema-specification--relational-models)
   - 4.2 [Complete Entity-Relationship (ER) Diagram](#42-complete-entity-relationship-er-diagram)
   - 4.3 [Database Client Singleton Pattern](#43-database-client-singleton-pattern)
   - 4.4 [Official 51 Commodities Database Seed Engine](#44-official-51-commodities-database-seed-engine)
   - 4.5 [Real Maharashtra APMC Mandi Cluster (20+ Seeded Mandis)](#45-real-maharashtra-apmc-mandi-cluster-20-seeded-mandis)
   - 4.6 [Automated Pre-Configured Test Accounts](#46-automated-pre-configured-test-accounts)
5. [Module 1: Authentication, Session Lifecycle & RBAC](#5-module-1-authentication-session-lifecycle--rbac)
   - 5.1 [Personas & Authorization Matrix](#51-personas--authorization-matrix)
   - 5.2 [Token Architecture, Dual-Token Rotation & Reuse Detection](#52-token-architecture-dual-token-rotation--reuse-detection)
   - 5.3 [Transactional Email & OTP Engine (Resend)](#53-transactional-email--otp-engine-resend)
   - 5.4 [Defensive Security Controls & Middlewares](#54-defensive-security-controls--middlewares)
   - 5.5 [Complete Auth & User API Reference](#55-complete-auth--user-api-reference)
6. [Module 2: APMC Mandi Operations & Gate Intake System (Backend V1)](#6-module-2-apmc-mandi-operations--gate-intake-system-backend-v1)
   - 6.1 [4-Stage Mandi Lifecycle & Operational Security](#61-4-stage-mandi-lifecycle--operational-security)
   - 6.2 [Policy Enforcement & Middlewares (`requireApprovedMandi`)](#62-policy-enforcement--middlewares-requireapprovedmandi)
   - 6.3 [Arrival Slot Capacity Allocation & Buffer Equations](#63-arrival-slot-capacity-allocation--buffer-equations)
   - 6.4 [QR Token Verification & Post-Weighbridge Settlement](#64-qr-token-verification--post-weighbridge-settlement)
   - 6.5 [Complete Mandi API Endpoints Reference](#65-complete-mandi-api-endpoints-reference)
7. [Module 3: Mandi Operator Web Portal (`apps/frontend`)](#7-module-3-mandi-operator-web-portal-appsfrontend)
   - 7.1 [Design System, Neutral Dark Theme & Layout Architecture](#71-design-system-neutral-dark-theme--layout-architecture)
   - 7.2 [KYC Verification Shield & Lock Overlay](#72-kyc-verification-shield--lock-overlay)
   - 7.3 [Interactive Gate Entry & Electronic QR Scanner](#73-interactive-gate-entry--electronic-qr-scanner)
   - 7.4 [Slot Allocation & Capacity Management Interface](#74-slot-allocation--capacity-management-interface)
   - 7.5 [Redux Store Architecture (`authSlice`, `mandiSlice`)](#75-redux-store-architecture-authslice-mandislice)
8. [Module 4: Farmer Mobile Client — Farmer Setu (`apps/application/farmer-setu`)](#8-module-4-farmer-mobile-client--farmer-setu-appsapplicationfarmer-setu)
   - 8.1 [Expo SDK 57 & React Native 0.86 Architecture](#81-expo-sdk-57--react-native-086-architecture)
   - 8.2 [Cross-Platform Backend Connectivity & IP Auto-Discovery](#82-cross-platform-backend-connectivity--ip-auto-discovery)
   - 8.3 [Strict Single-Role Farmer Onboarding Flow](#83-strict-single-role-farmer-onboarding-flow)
   - 8.4 [Sequential Farmer ID (`FAR001`) & Mandatory KYC Shield](#84-sequential-farmer-id-far001--mandatory-kyc-shield)
   - 8.5 [Interactive OpenStreetMap Leaflet Map Integration](#85-interactive-openstreetmap-leaflet-map-integration)
   - 8.6 [Live GPS Location & Reverse Geocoding Detection](#86-live-gps-location--reverse-geocoding-detection)
   - 8.7 [Dashboard Widgets: Ticker, Weather, Quick Actions & Filters](#87-dashboard-widgets-ticker-weather-quick-actions--filters)
   - 8.8 [Resilient Storage Fallback Utility (`@react-native-async-storage`)](#88-resilient-storage-fallback-utility-react-native-async-storage)
9. [Module 5: Multi-Language Localization Engine (`docs/language_module`)](#9-module-5-multi-language-localization-engine-docslanguage_module)
   - 9.1 [Supported Languages & Architecture (`en`, `mr`, `hi`)](#91-supported-languages--architecture-en-mr-hi)
   - 9.2 [Dynamic Mandi & Crop Translation Dictionaries](#92-dynamic-mandi--crop-translation-dictionaries)
   - 9.3 [Context Implementation & Instant UI Switching](#93-context-implementation--instant-ui-switching)
10. [Module 6: ImageKit Cloud Storage & Media Integration](#10-module-6-imagekit-cloud-storage--media-integration)
    - 10.1 [Cloud Storage Hierarchy & Configuration](#101-cloud-storage-hierarchy--configuration)
    - 10.2 [Backend Upload Handlers & Authentication Tokens](#102-backend-upload-handlers--authentication-tokens)
    - 10.3 [Mobile Camera & Gallery Image Picker Integration](#103-mobile-camera--gallery-image-picker-integration)
11. [Module 7: Agrovia Landing Page & Marketing Platform (`apps/landing`)](#11-module-7-agrovia-landing-page--marketing-platform-appslanding)
    - 11.1 [Next.js 16 App Router Architecture](#111-nextjs-16-app-router-architecture)
    - 11.2 [Visual Aesthetics, Micro-Interactions & Lenis Smooth Scroll](#112-visual-aesthetics-micro-interactions--lenis-smooth-scroll)
    - 11.3 [Component Breakdown & Content Structure](#113-component-breakdown--content-structure)
12. [Monorepo Workspace Applications & Packages Breakdown](#12-monorepo-workspace-applications--packages-breakdown)
    - 12.1 [`apps/backend` (Express.js REST API on Bun)](#121-appsbackend-expressjs-rest-api-on-bun)
    - 12.2 [`apps/frontend` (Mandi Operator Web Client)](#122-appsfrontend-mandi-operator-web-client)
    - 12.3 [`apps/application/farmer-setu` (Farmer Expo Mobile App)](#123-appsapplicationfarmer-setu-farmer-expo-mobile-app)
    - 12.4 [`apps/landing` (Next.js 16 Marketing Platform)](#124-appslanding-nextjs-16-marketing-platform)
    - 12.5 [`packages/database` (`@repo/database`)](#125-packagesdatabase-repodatabase)
    - 12.6 [`packages/ui` (`@repo/ui`)](#126-packagesui-repoui)
    - 12.7 [`packages/eslint-config` & `typescript-config`](#127-packageseslint-config--typescript-config)
13. [Complete Environment Variables & Secrets Matrix](#13-complete-environment-variables--secrets-matrix)
14. [Local Setup, Docker & Developer Runbook](#14-local-setup-docker--developer-runbook)
    - 14.1 [Prerequisites](#141-prerequisites)
    - 14.2 [Step-by-Step Installation](#142-step-by-step-installation)
    - 14.3 [Database Migrations & Seeding Runbook](#143-database-migrations--seeding-runbook)
    - 14.4 [Running the Services Locally](#144-running-the-services-locally)
    - 14.5 [Automated Testing Suite (Vitest)](#145-automated-testing-suite-vitest)
15. [Master Standard Error Code Dictionary](#15-master-standard-error-code-dictionary)
16. [Source Documentation & Traceability Index](#16-source-documentation--traceability-index)

---

## 1. Executive Summary & Platform Mission

The **SIH Agricultural Marketplace Platform** (branded as **Agrovia** / **Farmer Setu**) is an enterprise-grade digital public infrastructure designed to modernize India's agricultural supply chain, transform APMC (*Agricultural Produce Market Committee*) market yards, eliminate physical gate congestion, and empower Indian farmers with direct price discovery and transparent trading.

### Core Objectives:
1. **Zero-Congestion APMC Yard Logistics**: Replace manual gate queues and handwritten paper passes with scheduled arrival slots and encrypted electronic tokens (`TKN-XXXX`).
2. **Farmer Direct Empowerment**: Provide farmers with real-time multi-mandi modal rates, automated GPS mandi discovery, zero-friction mobile OTP onboarding, and native multi-language interfaces in Marathi, Hindi, and English.
3. **Mandi Operator Digital Operations**: Modernize market yard operations with digital gate QR scanning, dynamic capacity budgeting, weighbridge verification, and statutory KYC onboarding under state administrative governance.
4. **Cloud-Native Asset Management**: Secure, instant document and photo uploads via ImageKit for KYC cards, crop inspection photos, and weighbridge slips.

---

## 2. Repository & Monorepo Architecture

The repository is organized as a high-performance monorepo governed by **Turborepo**, **Bun Workspaces**, and **TypeScript Strict Mode**:

```text
SIH-2026/
├── apps/
│   ├── backend/                     # Express.js REST API on Bun runtime (Port 4000)
│   │   ├── src/
│   │   │   ├── config/              # Environment (env.ts), CORS, and server settings
│   │   │   ├── controllers/         # Pure functional request handlers (auth, user, farmer, mandi, upload)
│   │   │   ├── interfaces/          # TypeScript domain contracts & barrel exports
│   │   │   ├── lib/                 # ImageKit SDK client, Prisma singleton wrapper
│   │   │   ├── middlewares/         # auth, requireRole, requireApprovedMandi, rateLimiter, errorHandler
│   │   │   ├── routes/              # Express route routers (auth, user, farmer, mandi, admin, upload)
│   │   │   ├── schemas/             # Zod validation schemas (mandi, auth, farmer)
│   │   │   ├── services/            # Pure business logic services (auth, email, mandi, farmer, upload)
│   │   │   ├── utils/               # Cryptographic hashing, token generators, formatters
│   │   │   ├── app.ts               # Express application initialization & middleware stack
│   │   │   └── index.ts             # HTTP server entrypoint and port binding
│   │   └── tests/                   # Vitest unit & integration test suites (auth, rbac, mandi, upload)
│   │
│   ├── frontend/                    # Mandi Operator Web Portal (Port 5173 / Vite + React 19)
│   │   ├── src/
│   │   │   ├── components/          # Mandi dashboard, slots manager, gate scanner, review modals
│   │   │   ├── interfaces/          # Mandi and auth state contracts
│   │   │   ├── services/            # Axios API clients with auto-refresh interceptors
│   │   │   ├── store/               # Redux Toolkit store (authSlice, mandiSlice)
│   │   │   └── App.tsx              # Mandi route switch & approval status guard
│   │   └── package.json
│   │
│   ├── application/
│   │   └── farmer-setu/             # Farmer Mobile Client (Expo SDK 57 / React Native 0.86)
│   │       ├── src/
│   │       │   ├── app/             # Expo Router file-based navigation (_layout, index, auth, farmer)
│   │       │   ├── components/      # UI components, OpenStreetMap viewer, KYC modal, filters
│   │       │   ├── constants/       # Theme tokens, 3-language translations dictionary
│   │       │   ├── context/         # AuthContext, LanguageContext
│   │       │   ├── hooks/           # useUserLocation, responsive hooks
│   │       │   ├── interfaces/      # Mobile domain interfaces (auth, farmer, mandi, language, upload)
│   │       │   ├── services/        # Mobile API client, auth service, farmer service, upload service
│   │       │   └── utils/           # Resilient storage fallback utility, geolocation math
│   │       └── package.json
│   │
│   └── landing/                     # Next.js 16+ Marketing Platform (Port 3000)
│       ├── src/
│       │   ├── app/                 # Next.js App Router (layout.tsx, page.tsx, globals.css)
│       │   └── components/          # Hero, Navbar, SolutionsAccordion, Marquee, FAQ, Footer
│       └── package.json
│
├── packages/
│   ├── database/                    # Shared Prisma ORM package (@repo/database)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Canonical database models & enums
│   │   │   └── migrations/          # Versioned PostgreSQL migration history
│   │   ├── src/
│   │   │   ├── index.ts             # Global singleton PrismaClient instance & exports
│   │   │   └── seed.ts              # 51 official commodities & 20+ Maharashtra mandis seed engine
│   │   └── package.json
│   │
│   ├── ui/                          # Shared React UI component library (@repo/ui)
│   │   ├── src/                     # Shared Button, Card, Badge, Modal, Input components
│   │   └── package.json
│   │
│   ├── eslint-config/               # Shared ESLint configuration presets (@repo/eslint-config)
│   └── typescript-config/           # Shared compiler configurations (@repo/typescript-config)
│
└── docs/                            # Modular engineering documentation
    ├── application_auth/            # Farmer Setu mobile auth architecture
    ├── auth_module/                 # Master authentication & session rotation specification
    ├── dashboard_module/            # Render optimization & memoization guidelines
    ├── farmer_module/               # Farmer KYC, slot booking & ImageKit integration
    ├── language_module/             # Multi-language localization (en, mr, hi) documentation
    └── mandi_module/                # Mandi backend V1 & operator frontend specifications
```

---

## 3. Core Engineering Principles & Coding Standards

### 3.1 Strict Functional Programming Paradigm (Zero OOP/Classes)
* **No Classes**: Object-oriented patterns (`class Service`, `class Controller`, `this`, `extends`) are strictly forbidden across `apps/backend`, `apps/frontend`, and `apps/application/farmer-setu`.
* **Pure Exported Functions**: All business logic is encapsulated in modular functions:
  ```typescript
  // Canonical pattern
  export async function verifyGateToken(token: string, mandiId: string): Promise<GatePassVerificationResult> { ... }
  ```
* **Dependency Injection via Arguments**: External dependencies (database client, utilities) are passed explicitly or imported from dedicated singleton utility modules.

### 3.2 Type & Interface Management (Single Source of Truth)
* **Zero Inline Types**: Never define complex types inside controllers, route files, or JSX files.
* **Unified Interface Layer**: Every application maintains an `interfaces/` directory with a root barrel `index.ts`. All external consumers import exclusively from `@/interfaces` or `../interfaces/index.js`.
* **Prisma Model Re-exports**: All raw database record types originate from `@prisma/client` and are re-exported through domain interfaces.

### 3.3 Shared Database Pattern (`@repo/database`)
* `packages/database` is the sole owner of `schema.prisma` and Prisma migrations.
* All applications consume database operations via the shared package:
  ```typescript
  import { prisma, Role, MandiApprovalStatus, BookingStatus } from "@repo/database";
  ```

### 3.4 Windows NTFS Compatibility & Git Sparse-Checkout
* **Windows Constraint**: Windows NTFS rejects directory or file names ending with a trailing space. Upstream branches with folders such as `AI_INSTRUCTIONS/application/farmer_details /` will fail checkout.
* **Resolution**: Use `git sparse-checkout` in non-cone mode (`.git/info/sparse-checkout`) to exclude paths with trailing whitespace:
  ```text
  /*
  *
  !AI_INSTRUCTIONS/application/farmer_details */
  !AI_INSTRUCTIONS/application/farmer_details *
  !AI_INSTRUCTIONS/application/farmer_details /**
  ```

### 3.5 Git Branching & Atomic Commit Rules
* **Conventional Commits**: Format all commits as `type(scope): imperative description` (e.g., `feat(farmer): add KYC verification guard`, `fix(auth): rotate refresh tokens safely`).
* **Branch Isolation**: Work on designated feature branches (e.g., `Mrunal_Backend`, `rupesh/language`). Keep working trees clean before pulling upstream `main`.

### 3.6 Production Safeguards & Security Rules
* **Zero Secret Leakage**: No hardcoded API keys, JWT secrets, or cloud credentials in source code.
* **Defensive HTTP Stack**: Global `helmet()` security headers, strict CORS whitelists, and express payload limiters (`10mb`).
* **Zod Gatekeeping**: Every incoming HTTP body is strictly parsed and validated with Zod before invoking service logic.

---

## 4. Shared Database Architecture (`packages/database`)

### 4.1 Prisma Schema Specification & Relational Models

The relational schema supports authentication, farmer profiles, APMC market profiles, official commodities, arrival slots, gate bookings, legal documents, and session security.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  FARMER
  MANDI_OPERATOR
  ADMIN
}

enum OtpType {
  EMAIL_VERIFICATION
  LOGIN_OTP
  PASSWORD_RESET
}

enum FarmerIdType {
  AADHAAR
  PAN
  DRIVING_LICENSE
}

enum MandiApprovalStatus {
  PENDING_ONBOARDING
  PENDING_APPROVAL
  APPROVED
  REJECTED
  REQUIRES_DOCUMENTS
}

enum BookingStatus {
  PENDING
  ACCEPTED
  REJECTED
  ARRIVED
  VERIFIED
  COMPLETED
  CANCELLED
}

enum LegalDocType {
  MANDI_LICENSE
  APMC_REGISTRATION
  GST_CERTIFICATE
  OTHER
}

enum DocVerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

model User {
  id                  String               @id @default(cuid())
  name                String
  email               String               @unique
  phone               String?              @unique
  passwordHash        String
  role                Role                 @default(FARMER)
  isVerified          Boolean              @default(false)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  refreshTokens       RefreshToken[]
  otps                OtpVerification[]
  passwordResetTokens PasswordResetToken[]
  farmerProfile       FarmerProfile?
  mandiProfile        MandiProfile?
  farmerBookings      Booking[]            @relation("FarmerBookings")

  @@index([email])
  @@index([phone])
  @@index([role])
}

model FarmerProfile {
  id                 String          @id @default(cuid())
  userId             String          @unique
  user               User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  farmerCode         String?         @unique // Formatted: FAR001, FAR002...
  dob                String?         // Format: YYYY-MM-DD
  address            String?         // Full Address
  idType             FarmerIdType?   // AADHAAR, PAN, DRIVING_LICENSE
  idNumber           String?
  avatarUrl          String?
  isProfileComplete  Boolean         @default(false)

  addressLine1       String?
  addressLine2       String?
  village            String?
  taluka             String?
  district           String?
  state              String?
  pincode            String?
  
  landSizeAcres      Float?
  mainCrops          String[]        @default([])
  secondaryCrops     String[]        @default([])
  irrigationType     String?
  farmLocation       String?
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([userId])
  @@index([farmerCode])
  @@index([district, state])
  @@index([isProfileComplete])
}

model MandiProfile {
  id                  String               @id @default(cuid())
  userId              String               @unique
  user                User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  mandiName           String?
  apmcCode            String?              @unique
  address             String?
  district            String?
  state               String?
  operatingHours      String?              @default("08:00 AM - 06:00 PM (Mon-Sat)")
  
  latitude            Float?
  longitude           Float?
  topCrop             String?
  acceptedCrops       String[]             @default([])
  modalPrice          String?
  priceTrend          String?
  trendDirection      String?              @default("up")
  estimatedQueueTime  String?              @default("20 mins wait")
  activeFarmersCount  Int                  @default(85)
  isOpen              Boolean              @default(true)

  aadhaarNumber       String?
  aadhaarVerified     Boolean              @default(false)
  aadhaarDocUrl       String?
  avatarUrl           String?
  approvalStatus      MandiApprovalStatus  @default(PENDING_ONBOARDING)
  rejectionReason     String?
  approvedAt          DateTime?
  rating              Float                @default(4.8)
  totalReviews        Int                  @default(0)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  slots               MandiSlot[]
  bookings            Booking[]
  legalDocs           MandiLegalDoc[]

  @@index([userId])
  @@index([apmcCode])
  @@index([approvalStatus])
  @@index([district, state])
}

model Commodity {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String?  // Cereals, Pulses, Vegetables, Fruits, Oilseeds, Spices, Cash Crops, Plantation
  defaultUnit String   @default("kg")
  createdAt   DateTime @default(now())

  @@index([name])
}

model MandiSlot {
  id                     String       @id @default(cuid())
  mandiProfileId         String
  mandiProfile           MandiProfile @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)
  crop                   String
  date                   String       // YYYY-MM-DD
  startTime              String       // HH:mm
  endTime                String       // HH:mm
  totalCapacityQuintals  Float
  bookedCapacityQuintals Float        @default(0)
  capacityPercentage     Float        @default(0)
  maxFarmers             Int
  bookedFarmers          Int          @default(0)
  availableBookings      Int
  bufferMinutes          Int          @default(15)
  bufferPercentage       Float        @default(10)
  isActive               Boolean      @default(true)
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt

  bookings               Booking[]

  @@index([mandiProfileId])
  @@index([date, crop])
  @@index([isActive])
}

model Booking {
  id                 String        @id @default(cuid())
  token              String        @unique // TKN-XXXX
  farmerId           String
  farmer             User          @relation("FarmerBookings", fields: [farmerId], references: [id], onDelete: Cascade)
  mandiProfileId     String
  mandiProfile       MandiProfile  @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)
  slotId             String
  slot               MandiSlot     @relation(fields: [slotId], references: [id], onDelete: Cascade)
  crop               String
  variety            String?
  quantityQuintals   Float
  capacityPercentage Float         @default(0)
  vehicleNumber      String?
  status             BookingStatus @default(PENDING)
  notes              String?
  verifiedAt         DateTime?
  completedAt        DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([farmerId])
  @@index([mandiProfileId])
  @@index([slotId])
  @@index([token])
  @@index([status])
}

model MandiLegalDoc {
  id             String                @id @default(cuid())
  mandiProfileId String
  mandiProfile   MandiProfile          @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)
  name           String
  type           LegalDocType          @default(MANDI_LICENSE)
  status         DocVerificationStatus @default(PENDING)
  fileUrl        String?
  uploadedAt     DateTime              @default(now())

  @@index([mandiProfileId])
}

model RefreshToken {
  id                  String    @id @default(cuid())
  tokenHash           String    @unique
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt           DateTime
  revokedAt           DateTime?
  replacedByTokenHash String?
  createdAt           DateTime  @default(now())

  @@index([userId])
  @@index([tokenHash])
}

model OtpVerification {
  id          String    @id @default(cuid())
  identifier  String
  userId      String?
  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  codeHash    String
  type        OtpType
  expiresAt   DateTime
  consumedAt  DateTime?
  createdAt   DateTime  @default(now())

  @@index([identifier, type])
  @@index([userId])
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([tokenHash])
}
```

---

### 4.2 Complete Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| FarmerProfile : "has profile"
    User ||--o| MandiProfile : "manages mandi"
    User ||--o{ RefreshToken : "owns sessions"
    User ||--o{ OtpVerification : "receives OTPs"
    User ||--o{ PasswordResetToken : "requests reset"
    User ||--o{ Booking : "books slots"

    MandiProfile ||--o{ MandiSlot : "schedules arrival slots"
    MandiProfile ||--o{ Booking : "receives gate passes"
    MandiProfile ||--o{ MandiLegalDoc : "uploads statutory KYC"

    MandiSlot ||--o{ Booking : "reserves capacity"

    Commodity {
        string id PK
        string name UK
        string category
        string defaultUnit
    }

    FarmerProfile {
        string id PK
        string userId FK
        string farmerCode UK
        string dob
        string address
        string idNumber
        boolean isProfileComplete
    }

    MandiProfile {
        string id PK
        string userId FK
        string apmcCode UK
        string mandiName
        float latitude
        float longitude
        string approvalStatus
    }
```

---

### 4.3 Database Client Singleton Pattern

Located in `packages/database/src/index.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
```

---

### 4.4 Official 51 Commodities Database Seed Engine

Defined in `packages/database/src/seed.ts`, the platform seeds all 51 official agricultural commodities recognized across Indian APMC yards and e-NAM markets:

| Category | Official Commodities |
|---|---|
| **Cereals (6)** | Wheat, Paddy, Maize, Bajra, Jowar, Barley, Ragi |
| **Pulses (6)** | Chana, Tur, Moong, Urad, Masoor, Chickpea |
| **Oilseeds (6)** | Soybean, Mustard, Groundnut, Sesame, Sunflower, Castor |
| **Vegetables (12)** | Onion, Potato, Tomato, Peas, Cabbage, Cauliflower, Brinjal, Okra, Green Chilli, Capsicum, Carrot, Radish |
| **Fruits (9)** | Mango, Apple, Banana, Grapes, Pomegranate, Orange, Guava, Papaya, Watermelon |
| **Spices (5)** | Turmeric, Coriander, Cumin, Garlic, Ginger |
| **Cash & Plantation (7)** | Cotton, Sugarcane, Jute, Tobacco, Coconut, Areca Nut |

---

### 4.5 Real Maharashtra APMC Mandi Cluster (20+ Seeded Mandis)

The platform seeds over 20 real APMC market yards and sub-yards across Pune and Pimpri-Chinchwad with live geo-coordinates, real price trends, queue wait times, and accepted commodity sets:

1. **Morwadi APMC Sub-Yard** (`MH-PCMC-001`): Sant Tukaram Nagar, near DY Patil College, Morwadi, Pimpri (Lat: `18.6272`, Lng: `73.8131`).
2. **Pimpri Central Grain & Vegetable Mandi** (`MH-PCMC-002`): Station Road, Pimpri Gaon (Lat: `18.6255`, Lng: `73.8015`).
3. **Chinchwad Station Krishi Bazaar** (`MH-PCMC-003`): Old Pune-Mumbai Highway, Chinchwad (Lat: `18.6345`, Lng: `73.7892`).
4. **Bhosari APMC Industrial-Agro Terminal** (`MH-PCMC-004`): Pune-Nashik Highway, Bhosari (Lat: `18.6231`, Lng: `73.8475`).
5. **Akurdi Krishi Upaj Mandi** (`MH-PCMC-005`): Pradhikaran Sector 26, Akurdi (Lat: `18.6492`, Lng: `73.7708`).
6. **Moshi Modern APMC Yard** (`MH-PCMC-006`): Moshi Alandi Road (Lat: `18.6725`, Lng: `73.8492`).
7. **Pune Gultekdi Main APMC Market Yard** (`MH-PUN-001`): Gultekdi, Swargate, Pune (Lat: `18.4892`, Lng: `73.8652`).
8. **Hadapsar APMC Vegetable Yard** (`MH-PUN-002`): Pune-Solapur Road, Hadapsar (Lat: `18.5028`, Lng: `73.9275`).
9. **Khadki Cantonment Mandi** (`MH-PUN-003`): Old Pune-Mumbai Road, Khadki (Lat: `18.5628`, Lng: `73.8345`).
10. **Manchar Main APMC Market** (`MH-PUN-004`): Pune-Nashik Highway, Ambegaon Taluka (Lat: `19.0062`, Lng: `73.9421`).
11. **Junnar APMC (Narayangaon Tomato Yard)** (`MH-PUN-005`): Narayangaon, Junnar (Lat: `19.1235`, Lng: `73.9782`).
12. **Chakan APMC Onion-Potato Yard** (`MH-PUN-006`): Chakan Market Yard, Khed (Lat: `18.7562`, Lng: `73.8592`).
13. **Baramati Sub-Regional APMC Yard** (`MH-PUN-007`): Baramati MIDC Road (Lat: `18.1512`, Lng: `74.5772`).
14. **Additional Yards**: Daund, Shirur, Bhor, Saswad, Sangvi, Rahatani, Wakad, and Nigdi Pradhikaran yards.

---

### 4.6 Automated Pre-Configured Test Accounts

| Account Role | Email | Password | Status | Test Access & Permissions |
|---|---|---|---|---|
| **Farmer (Verified)** | `farmer@agrimarket.gov.in` | `Password@123` | `isVerified: true` | Farmer code `FAR001`, completed KYC, can book slots immediately. |
| **Farmer (New / Unverified)** | `farmer.new@agrimarket.gov.in` | `Password@123` | `isVerified: false` | Requires 6-digit OTP verification upon login. |
| **Approved Mandi Operator** | `mandi.approved@agrimarket.gov.in` | `Password@123` | `APPROVED` | Full access to operational dashboard, gate scanner, and slot creation. |
| **Pending Review Mandi** | `mandi.pending@agrimarket.gov.in` | `Password@123` | `PENDING_APPROVAL` | Submitted KYC documents; read-only glance dashboard; slot creation locked. |
| **Un-onboarded Mandi** | `mandi.new@agrimarket.gov.in` | `Password@123` | `PENDING_ONBOARDING` | Initial login; guided to complete KYC & APMC registration in Settings. |
| **Platform Administrator** | `admin@agrimarket.gov.in` | `Password@123` | `ADMIN` | Can review pending mandis, inspect KYC documents, and approve/reject yards. |

---

## 5. Module 1: Authentication, Session Lifecycle & RBAC

### 5.1 Personas & Authorization Matrix

| Route Group | `FARMER` | `MANDI_OPERATOR` | `ADMIN` | Unauthenticated |
|---|:---:|:---:|:---:|:---:|
| `/api/v1/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/api/v1/user/*` | ✅ | ✅ | ✅ | ❌ |
| `/api/v1/farmer/*` | ✅ | ❌ | ❌ | ❌ |
| `/api/v1/mandi/*` | ❌ | ✅ | ❌ | ❌ |
| `/api/v1/admin/*` | ❌ | ❌ | ✅ | ❌ |
| `/api/v1/upload/*` | ✅ | ✅ | ✅ | Public for `/auth` |

### 5.2 Token Architecture, Dual-Token Rotation & Reuse Detection
* **Access Token**: Short-lived JWT (15-minute expiry) signed with `JWT_SECRET`. Contains `{ userId, email, role, isVerified }`.
* **Refresh Token**: Long-lived cryptographic token (7-day expiry) stored as a SHA-256 hash in PostgreSQL.
* **Automatic Session Rotation**: Every call to `POST /api/v1/auth/refresh-token` revokes the incoming refresh token and issues a new token pair.
* **Reuse Detection / Theft Guard**: If an already revoked refresh token is presented, all active sessions belonging to that user are immediately invalidated (`revokedAt = now()`), forcing re-login across all devices.

### 5.3 Transactional Email & OTP Engine (Resend)
* **Provider**: Resend API (`RESEND_API_KEY`) with fallback mock logging in local development.
* **OTP Format**: 6-digit numeric string generated via cryptographic pseudo-random number generator.
* **Storage**: SHA-256 hashed in `OtpVerification` with 10-minute expiry.
* **Rate Limits**: Maximum 5 OTP attempts per identifier per hour. Resend cooldown of 60 seconds enforced on client and server.

### 5.4 Defensive Security Controls & Middlewares
* `authenticate`: Decodes Bearer token from `Authorization` header, checks revocation status, attaches `req.user`.
* `requireRole(...roles)`: Verifies `req.user.role` against authorized role set; responds with `403 Forbidden` (`FORBIDDEN_ROLE`).
* `rateLimiter`: IP-based sliding window rate limiter (100 requests per 15 minutes for standard routes, 5 requests per 15 minutes for `/auth/login` and `/auth/send-otp`).

### 5.5 Complete Auth & User API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Registers account, hashes password via `bcrypt`, generates verification OTP. |
| `POST` | `/api/v1/auth/login` | None | Validates credentials, checks role, checks `isVerified`, returns token pair. |
| `POST` | `/api/v1/auth/verify-otp` | None | Verifies 6-digit code, marks user `isVerified: true`, returns active session. |
| `POST` | `/api/v1/auth/send-otp` | None | Dispatches fresh 6-digit verification or login OTP. |
| `POST` | `/api/v1/auth/refresh-token` | None | Validates refresh token, executes rotation, returns new pair. |
| `POST` | `/api/v1/auth/logout` | Bearer | Revokes current refresh token session in database. |
| `POST` | `/api/v1/auth/forgot-password` | None | Dispatches password reset token via transactional email. |
| `POST` | `/api/v1/auth/reset-password` | None | Resets user password using valid token. |
| `GET` | `/api/v1/auth/me` | Bearer | Returns current authenticated user and linked role profile. |

---

## 6. Module 2: APMC Mandi Operations & Gate Intake System (Backend V1)

### 6.1 4-Stage Mandi Lifecycle & Operational Security

```text
[1. Operator Registration] ──> [2. Glance Dashboard (Read-Only)] ──> [3. Submit APMC KYC] ──> [4. Admin Approval & Unlock]
```

* Mandi operators register with email and password.
* Before administrative approval, operators can view their dashboard in read-only **Glance Mode** with prominent KYC prompts.
* Creating operational slots, scanning gate passes, and modifying market schedules are strictly locked until `approvalStatus === APPROVED`.

### 6.2 Policy Enforcement & Middlewares (`requireApprovedMandi`)
The `requireApprovedMandi` middleware guards operational endpoints:
```typescript
export async function requireApprovedMandi(req: Request, res: Response, next: NextFunction) {
  const mandiProfile = await getMandiProfileByUserId(req.user.userId);
  if (!mandiProfile || mandiProfile.approvalStatus !== MandiApprovalStatus.APPROVED) {
    return res.status(403).json({
      success: false,
      code: "MANDI_NOT_APPROVED",
      message: "Mandi must be approved by an administrator before executing this operation.",
      approvalStatus: mandiProfile?.approvalStatus ?? "PENDING_ONBOARDING",
    });
  }
  req.mandiProfile = mandiProfile;
  next();
}
```

### 6.3 Arrival Slot Capacity Allocation & Buffer Equations
To eliminate yard gridlock, arrival slots enforce physical capacity budgets:

$$\text{Capacity Percentage} = \left(\frac{\text{Booked Capacity Quintals}}{\text{Total Capacity Quintals}}\right) \times 100$$

$$\text{Usable Capacity} = \text{Total Capacity} \times \left(1 - \frac{\text{Buffer Percentage}}{100}\right)$$

* **Buffer Logic**: Default 10% capacity buffer and 15-minute time window buffer between slots to handle offloading delays and weighbridge queues.
* **Auto-Lock**: When booked quintals exceed usable capacity or `bookedFarmers >= maxFarmers`, the slot is marked full and omitted from farmer booking choices.

### 6.4 QR Token Verification & Post-Weighbridge Settlement
1. Farmer books slot $\rightarrow$ Generates unique token `TKN-` + 4 alphanumeric characters (e.g. `TKN-7821`) and encrypted QR payload.
2. Gate operator scans QR at physical yard entrance $\rightarrow$ Calls `POST /api/v1/mandi/verify-token`.
3. System verifies token validity, checks slot arrival date, marks `BookingStatus = ARRIVED`.
4. Vehicle proceeds to weighbridge $\rightarrow$ Net weight recorded $\rightarrow$ Status updated to `VERIFIED` and `COMPLETED`.

### 6.5 Complete Mandi API Endpoints Reference

| Method | Endpoint | Middleware Guard | Description |
|---|---|---|---|
| `GET` | `/api/v1/mandi/profile` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Fetches operator profile, APMC code, and KYC status. |
| `PUT` | `/api/v1/mandi/profile` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Updates yard address, operating hours, accepted crops. |
| `POST` | `/api/v1/mandi/submit-kyc` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Submits Aadhaar number and legal documents for Admin review. |
| `GET` | `/api/v1/mandi/dashboard` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Returns arrival metrics, capacity graphs, and KYC status. |
| `GET` | `/api/v1/mandi/slots` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Lists created arrival slots for the mandi. |
| `POST` | `/api/v1/mandi/slots` | `authenticate`, `requireApprovedMandi` | Creates a new arrival time-slot with capacity limits. |
| `DELETE` | `/api/v1/mandi/slots/:id` | `authenticate`, `requireApprovedMandi` | Deletes an unbooked or empty arrival slot. |
| `GET` | `/api/v1/mandi/bookings` | `authenticate`, `requireRole(MANDI_OPERATOR)` | Lists farmer arrival bookings filtered by date/crop. |
| `POST` | `/api/v1/mandi/verify-token`| `authenticate`, `requireApprovedMandi` | Scans and verifies gate electronic token `TKN-XXXX`. |
| `PATCH` | `/api/v1/mandi/bookings/:id/status` | `authenticate`, `requireApprovedMandi` | Updates booking status (`VERIFIED`, `COMPLETED`, `REJECTED`). |

---

## 7. Module 3: Mandi Operator Web Portal (`apps/frontend`)

### 7.1 Design System, Neutral Dark Theme & Layout Architecture
* Built with **Vite**, **React 19**, **Tailwind CSS**, and **Lucide React** icons.
* Uses an intentional neutral dark theme (`#0f172a`, `#1e293b`, `#334155`) with emerald accents (`#10b981`) for confirmed statuses and amber alerts (`#f59e0b`) for pending verification.
* Fully responsive navigation bar with live operational indicators, APMC yard name badges, and one-click sign out.

### 7.2 KYC Verification Shield & Lock Overlay
* When `approvalStatus !== APPROVED`:
  * A persistent warning banner appears at the top of all screens: *"Account Pending Verification: Your APMC credentials are under administrative review. Operational features are temporarily locked."*
  * Operational tabs (Slot Creation, Gate Scanner) display a glassmorphic lock overlay preventing accidental input.
  * Direct action link routes the operator to the Settings / KYC screen to submit missing statutory paperwork.

### 7.3 Interactive Gate Entry & Electronic QR Scanner
* Manual token lookup input with auto-formatting (`TKN-XXXX`).
* Camera-based QR code reader for instant tablet/phone gate scanning.
* Verification modal displaying farmer photo, sequential farmer ID, registered vehicle number, declared crop quantity, and arrival status buttons (`Mark Arrived`, `Verify Net Weight`, `Reject`).

### 7.4 Slot Allocation & Capacity Management Interface
* Visual capacity bar with dynamic progress colors:
  * 🟢 Green: $<70\%$ booked
  * 🟡 Amber: $70\% - 90\%$ booked
  * 🔴 Red: $>90\%$ booked (approaching buffer limit)
* Date and commodity filter tabs.
* Modal for scheduling new slot: crop selection from official 51 commodities, total quintals, max farmer vehicles, and buffer percentages.

### 7.5 Redux Store Architecture (`authSlice`, `mandiSlice`)
* `authSlice`: Manages operator JWT, refresh token, user details, and authentication status.
* `mandiSlice`: Manages mandi profile, approval status, live slot lists, pending bookings, active filters, and gate verification results.

---

## 8. Module 4: Farmer Mobile Client — Farmer Setu (`apps/application/farmer-setu`)

### 8.1 Expo SDK 57 & React Native 0.86 Architecture
* Built on **Expo SDK 57**, **React Native 0.86**, **Expo Router v57 (File-based routing)**, and **React 19**.
* Optimized for low-end Android smartphones prevalent in rural agricultural communities.

### 8.2 Cross-Platform Backend Connectivity & IP Auto-Discovery
* **Physical Device (Expo Go)**: Uses `expo-constants` to extract the development machine's local network IP automatically:
  ```typescript
  const debuggerHost = Constants.expoConfig?.hostUri || "";
  const host = debuggerHost.split(":")[0];
  const API_URL = `http://${host}:4000/api/v1`;
  ```
  Eliminates hardcoded `localhost` failures on physical testing devices.
* **Android Emulator**: Automatically routes to `http://10.0.2.2:4000/api/v1`.
* **Web Environment**: Direct connection to `http://localhost:4000/api/v1`.

### 8.3 Strict Single-Role Farmer Onboarding Flow
* The app is designed exclusively for farmers: zero role-selection screens.
* Registration automatically sends `role: "FARMER"`.
* Login strictly validates that the authenticated account has `role === "FARMER"`. Attempts to log in with Mandi Operator or Admin credentials are automatically rejected with a localized error message.

### 8.4 Sequential Farmer ID (`FAR001`) & Mandatory KYC Shield
* Every farmer receives a unique sequential identifier: `FAR` + 3 digits (e.g. `FAR001`, `FAR002`).
* **KYC Compliance Guard**:
  * Required fields: Full Address, Date of Birth (`YYYY-MM-DD`), Government ID Type (`AADHAAR`, `PAN`, `DRIVING_LICENSE`), ID Number, and optional Avatar.
  * `isProfileComplete: boolean` flag stored on `FarmerProfile`.
  * If incomplete: A persistent amber alert banner appears on the dashboard. Tapping "Book Gate Slot" at any mandi blocks the booking action and immediately launches the `ProfileCompletionModal`.
  * Backend API enforces this guard: `POST /api/v1/farmer/bookings` returns `403 Forbidden` (`PROFILE_INCOMPLETE`) if KYC is unverified.

### 8.5 Interactive OpenStreetMap Leaflet Map Integration
* **Elimination of Google Maps Black Screens**: Completely replaced Google Maps SDK with a lightweight, free OpenStreetMap Leaflet layer rendered inside `react-native-webview`.
* **Features**:
  * Displays user GPS pin with animated pulsing ripple effect.
  * Renders 20+ Maharashtra APMC Mandi pins with live price badges.
  * First-tap auto-zoom to selected mandi location.
  * Modal with directions, operating hours, queue length, and direct "Book Slot" shortcut.

### 8.6 Live GPS Location & Reverse Geocoding Detection
* Integrated via `expo-location` and custom `useUserLocation` hook.
* Automatically fetches user GPS latitude and longitude, converts to state and district via reverse geocoding, and pre-selects the nearest APMC market yard.

### 8.7 Dashboard Widgets: Ticker, Weather, Quick Actions & Filters
* **Commodity Price Ticker**: Horizontal scrolling marquee showing live mandi prices and day-over-day price trends across major crops.
* **Weather & Sowing Advisory**: Real-time temperature, rain probability, and agricultural weather advice.
* **Searchable & Calendar Filters**: `SearchablePickerModal` for 51 official commodities and `CalendarPickerModal` for selecting arrival dates.
* **Pull-to-Refresh**: Native pull-to-refresh on dashboard re-syncs active bookings and market prices.

### 8.8 Resilient Storage Fallback Utility (`@react-native-async-storage`)
* Backed by `@react-native-async-storage/async-storage` v2.2.0.
* Implements an in-memory memory fallback cache (`apps/application/farmer-setu/src/utils/storage.ts`) to prevent any unhandled native exceptions on initial app boot or corrupted storage states.

---

## 9. Module 5: Multi-Language Localization Engine (`docs/language_module`)

### 9.1 Supported Languages & Architecture (`en`, `mr`, `hi`)
The platform supports 3 primary languages tailored for Indian agricultural ecosystems:
1. **English (`en`)**: Default international interface.
2. **Marathi (`mr` / मराठी)**: Native dialect adapted for Maharashtra farmers and APMC yards.
3. **Hindi (`hi` / हिंदी)**: Standard terminology aligned with e-NAM national standards.

### 9.2 Dynamic Mandi & Crop Translation Dictionaries
Located in `apps/application/farmer-setu/src/constants/translations.ts`:
* **Dynamic APMC Mandi Name Translation**: Pure function `translateMandiName(name, lang)` dynamically maps all 20+ seeded Maharashtra APMC names to Marathi and Hindi.
* **Dynamic Commodity Name Translation**: Pure function `translateCropName(crop, lang)` dynamically translates produce names (e.g., Onion $\rightarrow$ कांदा / प्याज, Soybean $\rightarrow$ सोयाबीन, Cotton $\rightarrow$ कापूस / कपास, Wheat $\rightarrow$ गहू / गेहूं).
* **UI Dictionary**: Complete translations for navigation bars, KPI labels, filter chips, KYC forms, and auth validation banners.

### 9.3 Context Implementation & Instant UI Switching
* `LanguageContext` wraps the root layout.
* Exposes `language`, async `setLanguage(code)`, and parameterized string translation function `t(key, params)`.
* `LanguageSelectorPill` component rendered on auth screens and 3-way toggle in Settings provides instant language re-rendering across all screens without reloading.

---

## 10. Module 6: ImageKit Cloud Storage & Media Integration

### 10.1 Cloud Storage Hierarchy & Configuration
ImageKit is the platform's cloud media service, configured in `apps/backend/.env`:
* Endpoint: `https://ik.imagekit.io/frbjdpcvl`
* **Dedicated Directory Hierarchy**:
  * `/farmer_avatars`: Farmer profile photos and KYC headshots.
  * `/kyc_documents`: Scans of Aadhaar, PAN, and Driving Licenses.
  * `/mandi_photos`: APMC gate, yard, and weighbridge infrastructure photos.
  * `/crop_listings`: Commodity batch photos.
  * `/general`: General fallback uploads.

### 10.2 Backend Upload Handlers & Authentication Tokens
* **Direct Server Upload**: `POST /api/v1/upload/image`
  * Accepts `multipart/form-data` or `application/json` base64 payloads.
  * Uploads file to ImageKit via `imagekit.upload()`.
  * Returns permanent CDN URL and generated thumbnail URL.
* **Client Direct Token**: `GET /api/v1/upload/auth`
  * Returns client-side upload signature, expiry timestamp, and token for direct frontend-to-cloud uploads.
* **Asset Deletion**: `DELETE /api/v1/upload/image/:fileId`
  * Removes media asset from ImageKit cloud.

### 10.3 Mobile Camera & Gallery Image Picker Integration
* Service: `apps/application/farmer-setu/src/services/upload.service.ts`
* Uses `expo-image-picker` with permission handling for camera capture (`takePhotoAndUpload`) and gallery selection (`pickImageAndUpload`).
* Embedded directly into `ProfileCompletionModal.tsx` for instant photo capture and live preview.

---

## 11. Module 7: Agrovia Landing Page & Marketing Platform (`apps/landing`)

### 11.1 Next.js 16 App Router Architecture
* Built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**.
* Serves as the public gateway for platform onboarding, stakeholder education, and state APMC partnership inquiries.

### 11.2 Visual Aesthetics, Micro-Interactions & Lenis Smooth Scroll
* **Typography**: Clean modern type hierarchy using Inter and Outfit.
* **Smooth Inertia Scrolling**: Integrated with `@studio-freight/lenis` for buttery 60fps scrolling across desktop and mobile browsers.
* **Visual Polish**: Subtle mesh gradients, glassmorphic cards, and hover elevation states.

### 11.3 Component Breakdown & Content Structure
* `Navbar`: Sticky blurred header with quick jump links and role login CTAs.
* `Hero`: High-impact agricultural visual with stats counter and primary onboarding buttons.
* `SolutionsAccordion`: Interactive tabbed comparison between traditional manual gate entry vs. Agrovia digital tokens.
* `Marquee`: Dynamic sliding ticker showcasing partner APMCs and trade volume metrics.
* `FAQ`: Accordion answering questions about slot booking, KYC requirements, and e-NAM integration.
* `Footer`: Legal disclosures, APMC statutory compliance notices, and contact links.

---

## 12. Monorepo Workspace Applications & Packages Breakdown

### 12.1 `apps/backend` (Express.js REST API on Bun)
* **Port**: `4000`
* **Entry**: `src/index.ts` (Express server instance)
* **Testing**: `tests/*.test.ts` (Vitest test suite)

### 12.2 `apps/frontend` (Mandi Operator Web Client)
* **Port**: `5173` (Dev) / `3000` (Production)
* **Entry**: `src/main.tsx` (Vite + React)
* **Target Users**: Mandi Operators & APMC Market Managers

### 12.3 `apps/application/farmer-setu` (Farmer Expo Mobile App)
* **Port**: Metro bundler on `8081` / Expo Go
* **Entry**: `src/app/_layout.tsx` (Expo Router)
* **Target Users**: Indian Farmers & Producers

### 12.4 `apps/landing` (Next.js 16 Marketing Platform)
* **Port**: `3000`
* **Entry**: `src/app/page.tsx`
* **Target Users**: Public, prospective Mandis, and Government APMC boards

### 12.5 `packages/database` (`@repo/database`)
* Shared Prisma schema, migrations, singleton client, and database seeding script.

### 12.6 `packages/ui` (`@repo/ui`)
* Reusable design system React components (`Button`, `Card`, `Badge`, `Modal`).

### 12.7 `packages/eslint-config` & `typescript-config`
* Shared monorepo linter rules and base `tsconfig.json` compiler presets.

---

## 13. Complete Environment Variables & Secrets Matrix

| Variable Name | Required By | Sample Value | Description |
|---|---|---|---|
| `NODE_ENV` | All apps | `development` / `production` | Environment mode |
| `PORT` | `apps/backend` | `4000` | Backend HTTP listening port |
| `DATABASE_URL` | `@repo/database`, `backend` | `postgresql://postgres:postgres@localhost:5432/sih_db?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | `apps/backend` | `supersecretjwtkey1234567890` | Secret key for access token signing |
| `JWT_REFRESH_SECRET` | `apps/backend` | `supersecretrefreshkey1234567890` | Secret key for refresh tokens |
| `CLIENT_URL` | `apps/backend` | `http://localhost:5173` | Allowed web origin for CORS |
| `RESEND_API_KEY` | `apps/backend` | `re_123456789` | Resend API key for transactional emails |
| `EMAIL_FROM` | `apps/backend` | `noreply@agrimarket.gov.in` | Sender email address for OTPs |
| `IMAGEKIT_PUBLIC_KEY` | `apps/backend` | `public_DiSN/3jBr6w41xXQPGp2LHdAcxI=` | Public key for ImageKit storage |
| `IMAGEKIT_PRIVATE_KEY` | `apps/backend` | `private_UqO8ObeEL9BH77qUnJNEXyx9f4U=` | Private key for ImageKit storage |
| `IMAGEKIT_URL_ENDPOINT`| `apps/backend` | `https://ik.imagekit.io/frbjdpcvl` | ImageKit CDN URL endpoint |
| `VITE_API_BASE_URL` | `apps/frontend` | `http://localhost:4000/api/v1` | Backend API base URL for Mandi portal |
| `EXPO_PUBLIC_API_URL` | `farmer-setu` | `http://localhost:4000/api/v1` | Backend API base URL for mobile client |

---

## 14. Local Setup, Docker & Developer Runbook

### 14.1 Prerequisites
* **Bun**: `^1.3.14` installed globally.
* **Node.js**: `>= 24.0.0`.
* **Docker & Docker Compose**: For running local PostgreSQL instance.
* **Expo CLI**: `npx expo` for running mobile client.

### 14.2 Step-by-Step Installation

```bash
# 1. Clone repository
git clone https://github.com/SpoidyMon/SIH-2026.git
cd SIH-2026

# 2. Configure Windows Sparse Checkout (if on Windows)
git sparse-checkout init --no-cone
# Exclude folders with trailing spaces
echo "/*" > .git/info/sparse-checkout
echo "!AI_INSTRUCTIONS/application/farmer_details */" >> .git/info/sparse-checkout
git sparse-checkout reapply

# 3. Install all monorepo dependencies using Bun
bun install

# 4. Start local PostgreSQL container via Docker
docker-compose up -d
```

### 14.3 Database Migrations & Seeding Runbook

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database
bun run db:push

# Execute master seed engine (51 commodities, 20+ Mandis, test accounts)
bun run --cwd packages/database seed
```

### 14.4 Running the Services Locally

```bash
# Start all services concurrently via Turborepo
bun run dev

# Or start specific applications individually:
# 1. Backend REST API (Port 4000)
bun run --cwd apps/backend dev

# 2. Mandi Operator Web Portal (Port 5173)
bun run --cwd apps/frontend dev

# 3. Farmer Setu Mobile App (Expo Metro)
bun run --cwd apps/application/farmer-setu start

# 4. Next.js Marketing Landing (Port 3000)
bun run --cwd apps/landing dev
```

### 14.5 Automated Testing Suite (Vitest)

```bash
# Run backend test suite (Auth, RBAC, Mandi, Uploads)
bun run --cwd apps/backend test

# Run tests with code coverage report
bun run --cwd apps/backend test -- --coverage
```

---

## 15. Master Standard Error Code Dictionary

All API error responses adhere to a consistent JSON format:
```json
{
  "success": false,
  "code": "ERROR_CODE_STRING",
  "message": "Human-readable description of error.",
  "errors": []
}
```

| HTTP Status | Error Code | Description & Client Handling |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload failed Zod schema validation. Highlight offending inputs. |
| `400` | `INVALID_OTP` | The 6-digit OTP entered does not match or has expired. |
| `400` | `SLOT_CAPACITY_EXCEEDED` | Booked quintals would exceed slot buffer limits. Prompt farmer to reduce load or pick another slot. |
| `401` | `UNAUTHORIZED` | Missing or invalid Bearer JWT token. Redirect to login. |
| `401` | `TOKEN_EXPIRED` | Access token expired. Axios interceptor should trigger `/auth/refresh-token`. |
| `401` | `SESSION_REVOKED` | Refresh token reuse detected. Flush stored tokens and redirect to login. |
| `403` | `FORBIDDEN_ROLE` | Authenticated user lacks required role (`FARMER`, `MANDI_OPERATOR`, `ADMIN`). |
| `403` | `MANDI_NOT_APPROVED` | Mandi operator has not been approved by Admin. Display KYC review modal. |
| `403` | `PROFILE_INCOMPLETE` | Farmer has not completed mandatory KYC (ID proof / address). Launch `ProfileCompletionModal`. |
| `404` | `NOT_FOUND` | Requested entity (Mandi, Slot, Booking, User) does not exist in database. |
| `404` | `TOKEN_NOT_FOUND` | Gate electronic token `TKN-XXXX` was not found in booking database. |
| `409` | `EMAIL_EXISTS` | An account with this email address already exists. |
| `409` | `PHONE_EXISTS` | An account with this phone number already exists. |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests from this IP. Prompt user to wait before retrying. |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server error. Centralized error handler logs trace safely. |

---

## 16. Source Documentation & Traceability Index

This Version 3 context document consolidates and supersedes all prior specifications and module documents:

* **Authentication & RBAC**:
  * [Auth Architecture (`docs/auth_module/auth_architecture.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/auth_module/auth_architecture.md)
  * [Auth API Reference (`docs/auth_module/api_reference.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/auth_module/api_reference.md)
  * [Farmer Setu Auth Specification (`docs/application_auth/README.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/application_auth/README.md)
* **APMC Mandi Operations**:
  * [Mandi Module V1 Summary (`docs/mandi_module/SummaryV1.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/SummaryV1.md)
  * [Mandi API Reference (`docs/mandi_module/api_reference.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/api_reference.md)
  * [Mandi Frontend Specification (`docs/mandi_module/frontend_specification.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/frontend_specification.md)
  * [Mandi Frontend Integration (`docs/mandi_module/frontend_integration.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/frontend_integration.md)
* **Farmer Mobile & Cloud Storage**:
  * [Farmer KYC & Mandi Booking Architecture (`docs/farmer_module/farmer_kyc_and_mandi_booking.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/farmer_module/farmer_kyc_and_mandi_booking.md)
  * [ImageKit Cloud Storage Integration (`docs/farmer_module/imagekit_integration.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/farmer_module/imagekit_integration.md)
  * [Farmer API Integration (`docs/farmer_module/api_integration.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/farmer_module/api_integration.md)
* **Multi-Language Engine**:
  * [Language Module Specification (`docs/language_module/README.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/language_module/README.md)
* **Database & Seeding**:
  * [Prisma Canonical Schema (`packages/database/prisma/schema.prisma`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/packages/database/prisma/schema.prisma)
  * [Database Seeding Engine (`packages/database/src/seed.ts`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/packages/database/src/seed.ts)
* **Performance & Architecture**:
  * [Render Optimization Guidelines (`docs/dashboard_module/render_optimization.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/dashboard_module/render_optimization.md)
  * [Prior Master Context V2 (`PROJECT_CONTEXT_V2.md`)](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/PROJECT_CONTEXT_V2.md)
