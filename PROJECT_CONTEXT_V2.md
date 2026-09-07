# Consolidated Project Context: SIH Agricultural Marketplace Platform (Version 2)

> **Document Version**: 2.0.0 (Master Project Context)  
> **Repository**: `SIH-2026` (`SpoidyMon/SIH-2026`)  
> **Last Updated**: September 2026  
> **Status**: Comprehensive Single Source of Truth  
> **Synthesized Sources**: Consolidated from all architectural specifications, `.md` files, API references, frontend integration contracts, database schemas, and AI instruction prompts across the repository.

---

## Table of Contents

1. [Executive Summary & Platform Mission](#1-executive-summary--platform-mission)
2. [Repository & Monorepo Architecture](#2-repository--monorepo-architecture)
3. [Core Engineering Principles & Coding Standards](#3-core-engineering-principles--coding-standards)
   - 3.1 [Functional Programming Paradigm (Strict No-OOP Policy)](#31-functional-programming-paradigm-strict-no-oop-policy)
   - 3.2 [Type & Interface Management](#32-type--interface-management)
   - 3.3 [Shared Database Pattern (`@repo/database`)](#33-shared-database-pattern-repodatabase)
   - 3.4 [Git Branching & Atomic Commit Rules](#34-git-branching--atomic-commit-rules)
   - 3.5 [Documentation Integrity & Continuous Updating](#35-documentation-integrity--continuous-updating)
   - 3.6 [Production Safeguards & Security Rules](#36-production-safeguards--security-rules)
4. [Shared Database Architecture (`packages/database`)](#4-shared-database-architecture-packagesdatabase)
   - 4.1 [PostgreSQL & Prisma Schema Specification](#41-postgresql--prisma-schema-specification)
   - 4.2 [Complete Entity-Relationship (ER) Diagram](#42-complete-entity-relationship-er-diagram)
   - 4.3 [Database Client Singleton & Cross-Package Consumption](#43-database-client-singleton--cross-package-consumption)
   - 4.4 [Automated Test Seed Data & Pre-Configured Accounts](#44-automated-test-seed-data--pre-configured-accounts)
5. [Module 1: Authentication & Role-Based Access Control (RBAC)](#5-module-1-authentication--role-based-access-control-rbac)
   - 5.1 [Personas & Authorization Matrix](#51-personas--authorization-matrix)
   - 5.2 [Token Lifecycle, Session Rotation & Reuse Detection](#52-token-lifecycle-session-rotation--reuse-detection)
   - 5.3 [Transactional Email & OTP Delivery (Resend)](#53-transactional-email--otp-delivery-resend)
   - 5.4 [Defensive Security Matrix](#54-defensive-security-matrix)
   - 5.5 [Complete Auth & User API Reference](#55-complete-auth--user-api-reference)
   - 5.6 [Frontend Auth Integration Contract & Flows](#56-frontend-auth-integration-contract--flows)
6. [Module 2: APMC Mandi Operations & Electronic Gate System (Mandi V1)](#6-module-2-apmc-mandi-operations--electronic-gate-system-mandi-v1)
   - 6.1 [4-Stage Mandi Operational Lifecycle](#61-4-stage-mandi-operational-lifecycle)
   - 6.2 [Policy Middlewares & Approval Gates (`requireApprovedMandi`)](#62-policy-middlewares--approval-gates-requireapprovedmandi)
   - 6.3 [Complete Mandi API Endpoints Reference](#63-complete-mandi-api-endpoints-reference)
   - 6.4 [Arrival Slot Allocation, Buffer Logic & Capacity Calculation](#64-arrival-slot-allocation-buffer-logic--capacity-calculation)
   - 6.5 [QR Token Verification & Post-Weighbridge Settlement](#65-qr-token-verification--post-weighbridge-settlement)
   - 6.6 [Administrator Verification & Mandi Approval Workflow](#66-administrator-verification--mandi-approval-workflow)
7. [Module 3: Farmer Operations & Marketplace Integration](#7-module-3-farmer-operations--marketplace-integration)
   - 7.1 [Farmer Profile & Land Records](#71-farmer-profile--land-records)
   - 7.2 [Farmer API Endpoints](#72-farmer-api-endpoints)
   - 7.3 [Redux Store & Frontend Integration (`farmerSlice`)](#73-redux-store--frontend-integration-farmerslice)
8. [Module 4: Agrovia Landing Page & Design System](#8-module-4-agrovia-landing-page--design-system)
   - 8.1 [Visual Identity & Aesthetic Tokens](#81-visual-identity--aesthetic-tokens)
   - 8.2 [Typography & Layout Hierarchy](#82-typography--layout-hierarchy)
   - 8.3 [Micro-Animations & Smooth Inertia Scrolling (Lenis)](#83-micro-animations--smooth-inertia-scrolling-lenis)
   - 8.4 [Landing Page Component Architecture](#84-landing-page-component-architecture)
9. [Module 5: Dashboard Architecture & Render Optimization](#9-module-5-dashboard-architecture--render-optimization)
   - 9.1 [Granular Render Boundaries & Memoization Strategy](#91-granular-render-boundaries--memoization-strategy)
   - 9.2 [State Isolation & Frame Budgeting](#92-state-isolation--frame-budgeting)
10. [Monorepo Workspace Applications & Packages Breakdown](#10-monorepo-workspace-applications--packages-breakdown)
    - 10.1 [`apps/backend` (REST API Service)](#101-appsbackend-rest-api-service)
    - 10.2 [`apps/frontend` (Agrovia React Application)](#102-appsfrontend-agrovia-react-application)
    - 10.3 [`apps/landing` (Next.js 16 Marketing Platform)](#103-appslanding-nextjs-16-marketing-platform)
    - 10.4 [`apps/f-test` (Interactive API Testing Sandbox)](#104-appsf-test-interactive-api-testing-sandbox)
    - 10.5 [`packages/database` (`@repo/database`)](#105-packagesdatabase-repodatabase)
    - 10.6 [`packages/ui` (`@repo/ui`)](#106-packagesui-repoui)
    - 10.7 [`packages/eslint-config` & `typescript-config`](#107-packageseslint-config--typescript-config)
11. [Environment Variables & Configuration Matrix](#11-environment-variables--configuration-matrix)
12. [Local Setup, Docker & Developer Runbook](#12-local-setup-docker--developer-runbook)
    - 12.1 [Prerequisites](#121-prerequisites)
    - 12.2 [Step-by-Step Quickstart](#122-step-by-step-quickstart)
    - 12.3 [Database Operations & Migrations](#123-database-operations--migrations)
    - 12.4 [Automated Testing Suite (Vitest)](#124-automated-testing-suite-vitest)
    - 12.5 [Monorepo Command Dictionary](#125-monorepo-command-dictionary)
13. [Standard Error Code Dictionary for Frontend Engineers](#13-standard-error-code-dictionary-for-frontend-engineers)
14. [Source Markdown Documentation Traceability Index](#14-source-markdown-documentation-traceability-index)

---

## 1. Executive Summary & Platform Mission

The **SIH Agricultural Marketplace Platform** (branded as **Agrovia** / **KrishiSetu**) is a unified digital ecosystem designed to streamline India's agricultural supply chain, modernize APMC mandi operations, facilitate transparent crop auctions, and eliminate gate congestion.

### Primary User Personas:
1. **Farmers (`FARMER`)**: Producers booking arrival slots, comparing multi-mandi prices, generating electronic gate tokens (`TKN-XXXX`), and receiving direct digital trade settlements.
2. **Mandi Operators (`MANDI_OPERATOR`)**: Market yard managers configuring crop arrival time-windows, scanning gate passes, operating digital weighbridge intake, and managing trader lot allocations.
3. **Administrators (`ADMIN`)**: Platform governance officers reviewing statutory APMC licenses, verifying Aadhaar KYC, approving market yards, and overseeing multi-regional dispute arbitration.

The platform is engineered using **Turborepo**, **Bun**, **TypeScript**, **PostgreSQL + Prisma ORM**, **Express.js**, **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**.

---

## 2. Repository & Monorepo Architecture

The workspace is organized into independent services (`apps/`) and shared, modular packages (`packages/`), governed by **Turborepo** pipelines and **Bun Workspaces**:

```text
SIH-2026/
├── apps/
│   ├── backend/                     # Express.js REST API service running on Bun runtime (Port 4000)
│   │   ├── src/
│   │   │   ├── config/              # Environment (env.ts), CORS, and server settings
│   │   │   ├── controllers/         # Pure functional request handlers (auth, user, farmer, mandi)
│   │   │   ├── interfaces/          # TypeScript domain interfaces and barrel exports
│   │   │   ├── lib/                 # Utility wrappers and SDK clients
│   │   │   ├── middlewares/         # auth, requireRole, requireApprovedMandi, rateLimiter, errorHandler
│   │   │   ├── routes/              # Express route routers (auth, user, farmer, mandi, admin)
│   │   │   ├── schemas/             # Zod validation schemas (mandi.schema.ts, auth.schema.ts)
│   │   │   ├── scripts/             # Database seeding scripts (seed.ts)
│   │   │   ├── services/            # Pure business logic services (auth, email, mandi, farmer)
│   │   │   ├── utils/               # Cryptographic hashing, token generators, formatters
│   │   │   ├── app.ts               # Express application initialization & middleware stack
│   │   │   └── index.ts             # HTTP server entrypoint and port binding
│   │   ├── tests/                   # Vitest unit & integration test suites (auth, rbac, mandi)
│   │   └── package.json
│   │
│   ├── frontend/                    # Agrovia React 19 Client (Port 5173 / 3000)
│   │   ├── src/
│   │   │   ├── components/          # Farmer & Mandi dashboards, booking modals, digital passes
│   │   │   ├── interfaces/          # TypeScript interfaces for frontend state and API payloads
│   │   │   ├── services/            # Axios API clients with auto-refresh interceptors
│   │   │   ├── store/               # Redux Toolkit store (authSlice, farmerSlice)
│   │   │   ├── App.tsx              # Role-based route switcher & authentication guard
│   │   │   └── index.ts             # Bun HTTP frontend entrypoint
│   │   └── package.json
│   │
│   ├── landing/                     # Next.js 16+ Marketing & Onboarding Portal (Port 3000)
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   │   └── components/          # Hero, Navbar, SolutionsAccordion, Marquee, FAQ, Footer
│   │   ├── public/                  # Optimized images, icons, and static assets
│   │   └── package.json
│   │
│   ├── f-test/                      # Interactive Auth & API Sandbox Client (Port 5174)
│   │   ├── src/                     # Vite + React interactive API testing interface
│   │   └── package.json
│   │
│   └── Temp_frontend/               # Temporary build cache / staging directory
│
├── packages/
│   ├── database/                    # Shared Prisma schema, client singleton, migrations (@repo/database)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Canonical database schema & relational models
│   │   │   └── migrations/          # Version-controlled SQL migration history
│   │   ├── src/
│   │   │   └── index.ts             # Global singleton PrismaClient instance & model exports
│   │   └── package.json
│   │
│   ├── ui/                          # Shared React design system component library (@repo/ui)
│   │   ├── src/                     # Reusable Button, Card, Badge, Modal, Input components
│   │   └── package.json
│   │
│   ├── eslint-config/               # Shared ESLint configuration presets (@repo/eslint-config)
│   └── typescript-config/           # Shared tsconfig.json base compiler configs (@repo/typescript-config)
│
├── docs/                            # Modular, version-controlled engineering documentation
│   ├── auth_module/                 # Module 1: Auth Architecture, API reference, Frontend integration
│   ├── mandi_module/                # Module 2: Mandi V1 Reference, SummaryV1, API specs, Gate flow
│   ├── farmer_module/               # Module 3: Farmer Frontend API integration & Redux slice
│   ├── landing_page/                # Module 4: Agrovia Design System, tokens, typography & CSS specs
│   ├── dashboard_module/            # Module 5: Dashboard render optimization & component splitting
│   ├── application_auth/            # Application auth contract guides
│   └── how_to_start/                # Developer onboarding and setup runbooks (getting_started.md)
│
├── AI_INSTRUCTIONS/                 # Architectural prompts, requirements, and historical constraints
│   ├── module_auth/                 # Auth module prompt and specifications
│   ├── Mandi_BE/                    # Mandi backend prompts (p2.md, p3.md)
│   ├── module_booking/              # Slot booking prompt specifications
│   ├── module_dashboard/            # Dashboard layout and component prompt specifications
│   └── application/                 # Sub-application prompts
│
├── docker-compose.yml               # Local PostgreSQL container configuration (Port 5433 -> 5432)
├── agents.md                        # Master engineering rules, code style, git rules, agent instructions
├── turbo.json                       # Turborepo task pipeline configuration (build, dev, lint, check-types)
├── package.json                     # Monorepo root scripts, devDependencies, workspaces
├── PROJECT_CONTEXT_V2.md            # Consolidated Master Project Context (This Document)
└── bun.lock                         # Monorepo dependency lockfile
```

---

## 3. Core Engineering Principles & Coding Standards

*(Synthesized from `agents.md`, `CLAUDE.md`, and `AI_INSTRUCTIONS/`)*

### 3.1 Functional Programming Paradigm (Strict No-OOP Policy)
- **Zero Classes or OOP Boilerplate**: Never author code using ES6 classes (`class`), `this` binding, inheritance hierarchies, or OOP instance singletons.
- **Pure Functions & Modularity**: Author all controllers, business services, database queries, middlewares, and utility helpers as **pure, modular, exported functions**.
- **Self-Documenting & Clean**: Write simple, readable, idiomatic TypeScript with strict input validation and zero unnecessary abstractions.

### 3.2 Type & Interface Management
- **Dedicated `interfaces/` Directory**: All TypeScript types, DTOs, and interface definitions must reside in a dedicated `interfaces/` directory within each respective package/app (e.g., `apps/backend/src/interfaces/<module_name>.interface.ts`).
- **Barrel Exports**: Every interface must be barrel-exported through `interfaces/index.ts`.
- **Duplicate Prevention**: Before creating any new interface or type, verify whether an equivalent definition exists in `interfaces/`. If not, define it in a dedicated file and export it through `index.ts`.

### 3.3 Shared Database Pattern (`@repo/database`)
- **Single Source of Truth**: All database models, Prisma client configurations, and migration files **must** reside in `@repo/database` (`packages/database`).
- **Multi-Service Accessibility**: The `@repo/database` package is consumed by the backend REST API, background worker processes, future AI processing pipelines, and seed scripts.
- **No Local Schema Files**: Creating separate `schema.prisma` files inside `apps/backend` or other individual applications is strictly prohibited.

### 3.4 Git Branching & Atomic Commit Rules
- **No Direct Commits to `main`**: Direct modifications and pushes to the `main` branch are strictly forbidden.
- **Branch Naming Standard**: All work must occur on dedicated feature branches formatted as:
  ```text
  userName/<module_name>   (e.g., rupesh/auth_module, rupesh/mandi_module)
  ```
- **Atomic Commits**: Keep Git commits granular, descriptive, and atomic at every stage of development.
- **Zero Secret Commits**: Never commit `.env`, secret tokens, API credentials, or build artifacts (`dist/`, `.next/`).

### 3.5 Documentation Integrity & Continuous Updating
- Whenever a module, schema, or API route is modified, update the corresponding markdown documentation in `docs/<module_name>/`:
  - `overview.md`: Architectural decisions, entity diagrams, security rules.
  - `api_reference.md`: Endpoint paths, HTTP methods, headers, payloads, status codes.
  - `frontend_integration.md`: Frontend contract, UI state flows, token handling, error mapping.
- Maintain `docs/how_to_start/getting_started.md` whenever ports, commands, or setup steps change.

### 3.6 Production Safeguards & Security Rules
- Treat existing production safeguards, policies, and constraints as authoritative.
- Never weaken, disable, or bypass security safeguards (rate limiting, bcrypt hashing, token validation).
- Maintain backward compatibility across all public API surfaces.

---

## 4. Shared Database Architecture (`packages/database`)

The platform uses **PostgreSQL 16** managed via **Prisma ORM** in `packages/database` (`@repo/database`).

### 4.1 PostgreSQL & Prisma Schema Specification

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ----------------------------------------------------
// ENUMS
// ----------------------------------------------------

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

enum MandiApprovalStatus {
  PENDING_ONBOARDING   // Initial login, profile/KYC incomplete
  PENDING_APPROVAL     // Submitted KYC, awaiting admin approval
  APPROVED             // Approved by Admin; full operational access unlocked
  REJECTED             // Rejected by Admin with remarks
  REQUIRES_DOCUMENTS   // Additional documents requested
}

enum BookingStatus {
  PENDING              // Farmer submitted booking
  ACCEPTED             // Mandi confirmed slot
  ARRIVED              // Farmer arrived at market gate
  VERIFIED             // QR/Token scanned & verified at weighbridge
  COMPLETED            // Grain weighed, transaction completed
  REJECTED             // Rejected by Mandi
  CANCELLED            // Cancelled by Farmer/Mandi
}

enum LegalDocType {
  MANDI_LICENSE
  APMC_REGISTRATION
  GST_CERTIFICATE
  OTHER
}

// ----------------------------------------------------
// MODELS
// ----------------------------------------------------

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
  farmerBookings      Booking[]

  @@index([email])
  @@index([phone])
  @@index([role])
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
  identifier  String    // Email address or phone number
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

model FarmerProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  state          String?
  district       String?
  village        String?
  pincode        String?
  totalLandAcres Float?
  primaryCrops   String[] @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model MandiProfile {
  id               String               @id @default(cuid())
  userId           String               @unique
  mandiName        String?
  apmcCode         String?              @unique
  address          String?
  district         String?
  state            String?
  operatingHours   String?
  aadhaarNumber    String?
  aadhaarVerified  Boolean              @default(false)
  aadhaarDocUrl    String?
  avatarUrl        String?
  approvalStatus   MandiApprovalStatus  @default(PENDING_ONBOARDING)
  rejectionReason  String?
  approvedAt       DateTime?
  rating           Float                @default(4.8)
  totalReviews     Int                  @default(0)
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  user             User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  slots            MandiSlot[]
  bookings         Booking[]
  legalDocs        MandiLegalDoc[]
}

model MandiLegalDoc {
  id             String       @id @default(cuid())
  mandiProfileId String
  documentType   LegalDocType
  documentUrl    String
  documentNumber String?
  verified       Boolean      @default(false)
  createdAt      DateTime     @default(now())

  mandiProfile   MandiProfile @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)

  @@index([mandiProfileId])
}

model MandiSlot {
  id                     String       @id @default(cuid())
  mandiProfileId         String
  crop                   String
  date                   String       // Format: YYYY-MM-DD
  startTime              String       // Format: HH:mm
  endTime                String       // Format: HH:mm
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

  mandiProfile           MandiProfile @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)
  bookings               Booking[]

  @@index([mandiProfileId, date])
}

model Booking {
  id                   String        @id @default(cuid())
  mandiProfileId       String
  slotId               String
  farmerId             String
  crop                 String
  quantityQuintals     Float
  vehicleNumber        String?
  token                String        @unique // Format: TKN-XXXX
  qrCodeUrl            String?
  status               BookingStatus @default(PENDING)
  notes                String?
  actualWeightQuintals Float?
  finalPayoutAmount    Float?
  verifiedAt           DateTime?
  completedAt          DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  mandiProfile         MandiProfile  @relation(fields: [mandiProfileId], references: [id], onDelete: Cascade)
  slot                 MandiSlot     @relation(fields: [slotId], references: [id], onDelete: Cascade)
  farmer               User          @relation(fields: [farmerId], references: [id], onDelete: Cascade)

  @@index([mandiProfileId, status])
  @@index([farmerId])
  @@index([token])
}
```

---

### 4.2 Complete Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ REFRESH_TOKEN : "owns"
    USER ||--o{ OTP_VERIFICATION : "receives"
    USER ||--o{ PASSWORD_RESET_TOKEN : "requests"
    USER ||--o| FARMER_PROFILE : "has"
    USER ||--o| MANDI_PROFILE : "operates"
    USER ||--o{ BOOKING : "submits (farmer)"

    MANDI_PROFILE ||--o{ MANDI_SLOT : "allocates"
    MANDI_PROFILE ||--o{ MANDI_LEGAL_DOC : "submits"
    MANDI_PROFILE ||--o{ BOOKING : "manages"

    MANDI_SLOT ||--o{ BOOKING : "reserves"

    USER {
        string id PK "cuid"
        string name
        string email UK
        string phone UK "nullable"
        string passwordHash
        enum role "FARMER | MANDI_OPERATOR | ADMIN"
        boolean isVerified
        datetime createdAt
        datetime updatedAt
    }

    MANDI_PROFILE {
        string id PK "cuid"
        string userId FK "UK"
        string mandiName
        string apmcCode "UK"
        string district
        string state
        enum approvalStatus "PENDING_ONBOARDING | PENDING_APPROVAL | APPROVED | REJECTED | REQUIRES_DOCUMENTS"
        float rating "default 4.8"
        int totalReviews
    }

    MANDI_SLOT {
        string id PK "cuid"
        string mandiProfileId FK
        string crop
        string date "YYYY-MM-DD"
        string startTime "HH:mm"
        string endTime "HH:mm"
        float totalCapacityQuintals
        float bookedCapacityQuintals
        int maxFarmers
        int availableBookings
        int bufferMinutes "default 15"
        boolean isActive
    }

    BOOKING {
        string id PK "cuid"
        string mandiProfileId FK
        string slotId FK
        string farmerId FK
        string crop
        float quantityQuintals
        string vehicleNumber
        string token UK "TKN-XXXX"
        string qrCodeUrl
        enum status "PENDING | ACCEPTED | ARRIVED | VERIFIED | COMPLETED | REJECTED | CANCELLED"
        float actualWeightQuintals "nullable"
        float finalPayoutAmount "nullable"
        datetime verifiedAt "nullable"
        datetime completedAt "nullable"
    }
```

---

### 4.3 Database Client Singleton & Cross-Package Consumption

`packages/database/src/index.ts` exports a global singleton `PrismaClient` to prevent connection pool exhaustion during hot module reloading:

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export * from "@prisma/client";
export default prisma;
```

---

### 4.4 Automated Test Seed Data & Pre-Configured Accounts

To seed comprehensive test fixtures for evaluation, run from the backend workspace:
```bash
bun run seed:test-data
# or
bun src/scripts/seed.ts
```

| Account Persona | Email | Password | Role | Mandi Status | Permissions / Test Purpose |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Approved Mandi** | `mandi.approved@agrimarket.gov.in` | `Password@123` | `MANDI_OPERATOR` | **`APPROVED`** | Operational dashboard, slot creation, gate pass verification, weighbridge completion. |
| **Pending Mandi** | `mandi.pending@agrimarket.gov.in` | `Password@123` | `MANDI_OPERATOR` | **`PENDING_APPROVAL`** | Glance dashboard view, waiting for admin approval. |
| **New / Unonboarded** | `mandi.new@agrimarket.gov.in` | `Password@123` | `MANDI_OPERATOR` | **`PENDING_ONBOARDING`** | Glance dashboard with KYC prompt in Settings. |
| **Platform Admin** | `admin@agrimarket.gov.in` | `Password@123` | `ADMIN` | N/A | Reviewing applications (`GET /admin/mandi/pending`) and approving (`PATCH /admin/mandi/:id/approval-status`). |
| **Verified Farmer** | `farmer.ramesh@agrimarket.gov.in` | `Password@123` | `FARMER` | N/A | Booking slots, viewing passes, farmer profile. |

---

## 5. Module 1: Authentication & Role-Based Access Control (RBAC)

### 5.1 Personas & Authorization Matrix

| Route Group | Base Path | Required Role | Required Middleware |
| :--- | :--- | :---: | :--- |
| **Public Auth** | `/api/v1/auth/*` | Any / Guest | None (rate limited) |
| **Dedicated Registration** | `/api/v1/user/*` | Any / Guest | None (rate limited) |
| **User Profile** | `/api/v1/auth/me` | Authenticated User | `authenticate` |
| **Farmer Module** | `/api/v1/farmer/*` | `Role.FARMER` | `authenticate`, `requireRole(Role.FARMER)` |
| **Mandi Glance / Settings** | `/api/v1/mandi/profile`, `/dashboard` | `Role.MANDI_OPERATOR` | `authenticate`, `requireRole(Role.MANDI_OPERATOR)` |
| **Mandi Operational Core** | `/api/v1/mandi/slots`, `/bookings/*` | `Role.MANDI_OPERATOR` | `authenticate`, `requireRole`, `requireApprovedMandi` |
| **Platform Admin** | `/api/v1/admin/*` | `Role.ADMIN` | `authenticate`, `requireRole(Role.ADMIN)` |

---

### 5.2 Token Lifecycle, Session Rotation & Reuse Detection

- **`accessToken`**: Stateless JWT (15-minute validity). Contains payload `{ userId, email, role, isVerified }`.
- **`refreshToken`**: Cryptographically secure opaque random string (7-day validity). Stored exclusively as a SHA-256 hash in PostgreSQL.
- **Rotation & Chaining**: Every call to `POST /api/v1/auth/refresh` revokes the incoming token, marks its `replacedByTokenHash`, and issues a new pair.
- **Reuse Detection**: If an already-revoked refresh token is re-submitted (indicating token theft), the server immediately invalidates **all** active sessions belonging to that user.

---

### 5.3 Transactional Email & OTP Delivery (Resend)

- Transactional emails are dispatched using **Resend** (`resend` SDK).
- **6-Digit Numeric OTPs**: 10-minute validity for email verification and login.
- **Password Reset Tokens**: 64-character cryptographic hex string with 15-minute validity.
- **Development Fallback**: If `RESEND_API_KEY` is not configured, OTP codes and reset tokens are safely logged to the backend console.

---

### 5.4 Defensive Security Matrix

| Threat / Vulnerability | Defense Mechanism | Implementation Details |
| :--- | :--- | :--- |
| **Credential Cracking** | Bcrypt (Cost Factor 12) | Plaintext passwords are never logged or stored. |
| **Database Breach** | SHA-256 Token Hashing | Refresh tokens, reset tokens, and OTP codes stored as SHA-256 hashes. |
| **Token Theft / Replay** | Rotation & Reuse Detection | Revoked tokens trigger cascade invalidation of all user sessions. |
| **Replay Attacks** | Single-Use Timestamps | `consumedAt` and `usedAt` prevent OTP and token reuse. |
| **Brute-Force Flooding** | `express-rate-limit` | 10 attempts / 15m on login; 5 attempts / 10m on OTPs and forgot-password. |
| **Account Enumeration** | Constant-Response Messaging | Password reset returns generic 200 OK regardless of email existence. |
| **CORS / Protocol Abuse** | Dynamic Regex CORS & Helmet | Allowed development loopbacks, secure headers (CSP, HSTS, X-Content-Type). |

---

### 5.5 Complete Auth & User API Reference

Base URL: `http://localhost:4000/api/v1`

| Method | Route | Description | Auth Required | Rate Limited |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/register` | Unified user registration (`FARMER` or `MANDI_OPERATOR`) | No | Yes (30/15m) |
| `POST` | `/user/farmer` | Dedicated Farmer registration route | No | Yes (30/15m) |
| `POST` | `/user/mandi` | Dedicated Mandi Operator registration route | No | Yes (30/15m) |
| `POST` | `/auth/login` | Authenticate via email/phone & password | No | Yes (10/15m) |
| `POST` | `/auth/refresh` | Rotate and issue new access & refresh token pair | No | No |
| `POST` | `/auth/logout` | Revoke active refresh token session | No | No |
| `POST` | `/auth/send-otp` | Request 6-digit OTP code (`EMAIL_VERIFICATION` \| `LOGIN_OTP`) | No | Yes (5/10m) |
| `POST` | `/auth/verify-otp` | Verify 6-digit OTP & activate account (`isVerified: true`) | No | No |
| `POST` | `/auth/forgot-password` | Send password reset link & OTP via email | No | Yes (5/10m) |
| `POST` | `/auth/reset-password` | Set new password using reset token or OTP | No | No |
| `GET` | `/auth/me` | Fetch authenticated user session profile | Bearer Token | No |

---

### 5.6 Frontend Auth Integration Contract & Flows

1. **Registration & Role Selection Flow**:
   - User chooses role tab (**Farmer** or **Mandi Operator**).
   - Form posts to `/auth/register` (or `/user/farmer` / `/user/mandi`).
   - Server returns tokens with `isVerified: false`. Frontend renders the OTP verification view.
2. **Account OTP Verification Flow**:
   - User enters 6-digit code received via email.
   - Frontend calls `POST /auth/verify-otp` with `{ identifier, code, type: "EMAIL_VERIFICATION" }`.
   - On `200 OK`, account is marked verified, and the user is redirected to their dashboard.
3. **Login & Unverified Interception Flow**:
   - User enters email/phone and password.
   - If account is unverified, server responds with `403 Forbidden` (`code: "ACCOUNT_NOT_VERIFIED"`). Frontend routes to `/verify-otp?email=...`.
4. **Silent Refresh Interceptor Flow**:
   - Client attaches `Authorization: Bearer <accessToken>`.
   - On `401 Unauthorized` (`code: "TOKEN_EXPIRED_OR_INVALID"`), client pauses requests, calls `POST /auth/refresh`, updates tokens, and retries original requests.
   - If refresh returns `TOKEN_REUSE_DETECTED` or `REFRESH_TOKEN_EXPIRED`, client clears storage and navigates to `/login`.

---

## 6. Module 2: APMC Mandi Operations & Electronic Gate System (Mandi V1)

### 6.1 4-Stage Mandi Operational Lifecycle

```text
┌───────────────────────────┐
│ 1. Registration & Login   │ ──> Operator registers with role MANDI_OPERATOR & verifies email.
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 2. Glance Dashboard View  │ ──> Read-only dashboard KPIs with approvalStatus = PENDING_ONBOARDING.
│    (Read-Only Preview)    │ ──> Banner prompts: "Complete Mandi & KYC in Settings".
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 3. Settings KYC & Review  │ ──> Operator submits APMC Yard details, Aadhaar KYC & Statutory docs.
│    (Settings Submission)  │ ──> Transitions to approvalStatus = PENDING_APPROVAL.
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 4. Admin Verification     │ ──> Platform Administrator approves Mandi (Status: APPROVED).
│    & Full Feature Unlock  │ ──> Unlocks: Slot Management, Gate QR Scanner, Bookings Stream, Payouts.
└───────────────────────────┘
```

---

### 6.2 Policy Middlewares & Approval Gates (`requireApprovedMandi`)

- The **`requireApprovedMandi`** middleware enforces security at the controller layer:
- If a Mandi operator has `approvalStatus: "PENDING_APPROVAL"` or `"PENDING_ONBOARDING"` and attempts to create slots or verify gate passes, the server responds with:
  ```json
  {
    "success": false,
    "message": "Access restricted. Your Mandi registration is currently pending approval. Platform administrator approval is required.",
    "code": "MANDI_NOT_APPROVED",
    "data": {
      "approvalStatus": "PENDING_APPROVAL",
      "requiresOnboarding": false
    }
  }
  ```

---

### 6.3 Complete Mandi API Endpoints Reference

Base URL: `http://localhost:4000/api/v1`

#### A. Glance Dashboard & Rating
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/mandi/dashboard` | Returns high-level metrics & approval status | `authenticate`, `requireRole` |
| `GET` | `/mandi/rating` | Returns farmer rating score, precision %, gate wait times | `authenticate`, `requireRole` |

#### B. Profile, KYC & Statutory Onboarding
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/mandi/profile` | Retrieves current APMC Mandi profile and docs | `authenticate`, `requireRole` |
| `PUT` | `/mandi/profile` | Updates operating parameters (hours, address) | `validate`, `authenticate` |
| `POST` | `/mandi/kyc/aadhaar` | Submits operator Aadhaar number and doc URL | `validate`, `authenticate` |
| `POST` | `/mandi/kyc/documents` | Uploads statutory licenses (APMC License, GST) | `validate`, `authenticate` |
| `DELETE` | `/mandi/kyc/documents/:docId` | Deletes uploaded compliance document | `authenticate` |
| `POST` | `/mandi/onboarding` | Submits complete onboarding payload | `validate`, `authenticate` |

#### C. Arrival Slot Management (Operational)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/mandi/slots` | Creates new arrival slot with buffer & capacity | `requireApprovedMandi`, `validate` |
| `GET` | `/mandi/slots` | Lists slots filtered by date, crop, isActive | `requireApprovedMandi`, `validate` |
| `GET` | `/mandi/slots/:id` | Retrieves single slot by ID | `requireApprovedMandi` |
| `PUT` | `/mandi/slots/:id` | Edits existing slot timings and capacity | `requireApprovedMandi`, `validate` |
| `DELETE` | `/mandi/slots/:id` | Deletes slot and cascade-cancels pending bookings | `requireApprovedMandi` |
| `POST` | `/mandi/slots/default-preset` | Generates standard morning & afternoon default presets | `requireApprovedMandi` |

#### D. Booking Stream, Gate Verification & Weighbridge Settlement
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/mandi/bookings/current` | Active booking pipeline (`PENDING`, `ACCEPTED`, `ARRIVED`, `VERIFIED`) | `requireApprovedMandi`, `validate` |
| `GET` | `/mandi/bookings/previous` | Historical records (`COMPLETED`, `REJECTED`, `CANCELLED`) | `requireApprovedMandi`, `validate` |
| `PATCH` | `/mandi/bookings/:id/status` | Updates booking status (`ACCEPTED`, `ARRIVED`, `REJECTED`) | `requireApprovedMandi`, `validate` |
| `POST` | `/mandi/bookings/verify` | Verifies gate entry via QR code or `TKN-XXXX` token | `requireApprovedMandi`, `validate` |
| `PATCH` | `/mandi/bookings/:id/complete` | Records final weighbridge weight & calculates payout | `requireApprovedMandi`, `validate` |

---

### 6.4 Arrival Slot Allocation, Buffer Logic & Capacity Calculation

When a slot is created:
- `totalCapacityQuintals`: Maximum grain weight the yard can accommodate during that window.
- `bufferPercentage` (default 10%) & `bufferMinutes` (default 15m): Guard against truck turnaround delays.
- `availableBookings`: Dynamically updated as farmers book:
  $$\text{availableBookings} = \text{maxFarmers} - \text{bookedFarmers}$$
  $$\text{capacityPercentage} = \left(\frac{\text{bookedCapacityQuintals}}{\text{totalCapacityQuintals}}\right) \times 100$$

---

### 6.5 QR Token Verification & Post-Weighbridge Settlement

1. **Farmer Gate Token**: Upon booking confirmation, a unique 8-character token (e.g., `TKN-8492`) and matching QR payload are generated.
2. **Gate Entry Scanning**: Operator scans the QR pass or enters the token via `POST /mandi/bookings/verify`. Status updates to `VERIFIED` with `verifiedAt` timestamp.
3. **Weighbridge & Settlement**: Operator calls `PATCH /mandi/bookings/:id/complete` with `{ actualWeightQuintals, finalPayoutAmount }`. Status transitions to `COMPLETED`.

---

### 6.6 Administrator Verification & Mandi Approval Workflow

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/mandi/pending` | Lists all Mandi applications awaiting verification | `authenticate`, `requireRole(Role.ADMIN)` |
| `PATCH` | `/admin/mandi/:id/approval-status` | Updates status (`APPROVED`, `REJECTED`, `REQUIRES_DOCUMENTS`) with remarks | `authenticate`, `requireRole(Role.ADMIN)`, `validate` |

---

## 7. Module 3: Farmer Operations & Marketplace Integration

### 7.1 Farmer Profile & Land Records
- **Data Model**: `FarmerProfile` attached to `User` model.
- **Attributes**: `state`, `district`, `village`, `pincode`, `totalLandAcres`, `primaryCrops`.

### 7.2 Farmer API Endpoints

Base URL: `http://localhost:4000/api/v1`

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/farmer/dashboard` | Returns farmer overview KPIs and accessible modules | `authenticate`, `requireRole(Role.FARMER)` |
| `GET` | `/farmer/profile` | Retrieves farmer profile with land records | `authenticate`, `requireRole(Role.FARMER)` |
| `PUT` | `/farmer/profile` | Updates farmer profile, address, and crop choices | `authenticate`, `requireRole(Role.FARMER)` |

---

### 7.3 Redux Store & Frontend Integration (`farmerSlice`)

- **Location**: `apps/frontend/src/store/slices/farmerSlice.ts`
- **Actions / Thunks**: `fetchFarmerProfileThunk()`, `updateFarmerProfileThunk(payload)`.
- **State**: `profile: FarmerFullProfile | null`, `isLoading: boolean`, `isUpdating: boolean`, `error: string | null`, `successMessage: string | null`.

---

## 8. Module 4: Agrovia Landing Page & Design System

*(Synthesized from `docs/landing_page/design.md` and `apps/landing/`)*

### 8.1 Visual Identity & Aesthetic Tokens

Agrovia combines **high-end SaaS minimalism** with **earthy agricultural luxury**:
- **Warm Ivory Canvas**: `#FCFCFA` / `#F4F4F2` eliminating eye strain.
- **Deep Botanical Forest**: `#0B2D1B` & `#06180E` for high-authority headings and high-contrast dark buttons.
- **Electric Neon Lime**: `#C8F52F` / `#B8E624` for interactive focus, badges, and primary action buttons.
- **Soft Sage Wash**: `#ECFDF5` / `#E8F5E9` for status pills, capacity progress indicators, and card accents.

```css
@theme {
  --color-agri-dark: #0B2D1B;
  --color-agri-darker: #06180E;
  --color-agri-warm: #FCFCFA;
  --color-agri-surface: #F4F4F2;
  --color-agri-gray: #5A6C5F;
  --color-agri-gray-dark: #23382B;
  --color-agri-lime: #C8F52F;
  --color-agri-lime-hover: #B8E624;
  --color-agri-fade-green: #ECFDF5;
  --color-agri-emerald: #10B981;
  --color-agri-emerald-dark: #059669;
  --border-light: #E8EAEC;
  --border-subtle: #E2E5E9;
}
```

---

### 8.2 Typography & Layout Hierarchy

- **Primary Sans**: `Geist Sans` / System UI (Weights: 400, 500, 600, 700).
- **Editorial Accent**: `Geist Mono` & Editorial Serif Italic (`.font-editorial`).
- **Heading 1**: 48px – 64px, Leading 1.08.
- **Card Radii**: `rounded-[26px]` to `rounded-[32px]`; buttons use `rounded-full` or `rounded-xl`.

---

### 8.3 Micro-Animations & Smooth Inertia Scrolling (Lenis)

- **Marquee Track (`animate-marquee`)**: 24s linear infinite scrolling partner & APMC strip with hover pause.
- **Bobbing Badge (`animate-bobbing`)**: 2s ease-in-out floating badge translation.
- **Smooth Inertia Scrolling**: Lenis smooth scroll provider integrated in `apps/landing/src/components/SmoothScrollProvider.tsx`.

---

### 8.4 Landing Page Component Architecture

```text
Landing Page Layout:
├── 1. Navbar (Sticky pill with glassmorphism blur)
├── 2. Hero Section (Headline, editorial italics, dual CTA, live status badges)
├── 3. Trust Marquee (APMC Mandi partner strip)
├── 4. Platform Intro (Core value proposition grid)
├── 5. Solutions Accordion (Feature breakdown for Farmers & Mandis)
├── 6. Smart Solutions Carousel (Slot booking, token scanner, weighbridge sync)
├── 7. Statistics Grid (Volume moved, time saved, payout metrics)
├── 8. Testimonials (Verified farmer & operator reviews)
├── 9. FAQ Section (Accordion for bookings, gate pass, and KYC)
└── 10. Footer (Navigation columns, statutory compliance)
```

---

## 9. Module 5: Dashboard Architecture & Render Optimization

*(Synthesized from `docs/dashboard_module/render_optimization.md`)*

### 9.1 Granular Render Boundaries & Memoization Strategy

To eliminate cascading re-renders in heavy dashboards:
- **`BrowserChrome`**: Fully memoized (`React.memo`) with zero runtime prop dependencies.
- **`DashboardHeader`**: Encapsulates active tab state and sliding theme indicator locally.
- **`TotalBalanceCard`**: Houses `requestAnimationFrame` counter interpolation internally, isolating 60fps frame updates to its own DOM node.
- **`StatisticsChartCard`**: Encapsulates monthly dataset selections with memoized SVG path calculations (`useMemo`).
- **`PaymentScheduleCard` & `ScheduleRow`**: Uses granular memoized row components so toggling a checkbox only re-renders the single modified row.
- **`TopExpensesCard`**: Encapsulates category tab switching (`Food & Drinks`, `Shopping`, `Health`) locally.

---

## 10. Monorepo Workspace Applications & Packages Breakdown

### 10.1 `apps/backend` (REST API Service)
- **Runtime**: Bun + Express.js + TypeScript
- **Port**: `4000`
- **Features**: Stateless JWT + state-tracked refresh token auth, RBAC middlewares, Mandi V1 arrival slot engine, gate pass token verification, Resend transactional emails.

### 10.2 `apps/frontend` (Agrovia React Application)
- **Runtime / Bundler**: Bun + React 19 + Tailwind CSS
- **Port**: `5173`
- **Features**: Farmer Dashboard Shell, Mandi Operator Dashboard, Bookings Table, Digital Pass Modal, Mandi Map Explorer, Redux Toolkit state.

### 10.3 `apps/landing` (Next.js 16 Marketing Platform)
- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS + Turbopack
- **Port**: `3000`
- **Features**: Marketing portal, value proposition showcase, Lenis inertia scrolling, design system tokens.

### 10.4 `apps/f-test` (Interactive API Testing Sandbox)
- **Framework**: Vite + React
- **Port**: `5174`
- **Features**: Interactive API sandbox for manual request inspection, token simulation, and live endpoint testing.

### 10.5 `packages/database` (`@repo/database`)
- **Type**: Shared database library
- **Features**: Canonical Prisma schema, migration history, global singleton `PrismaClient`, and test data seed scripts.

### 10.6 `packages/ui` (`@repo/ui`)
- **Type**: Shared React component library
- **Features**: Button, Card, Badge, Modal, Input components shared across frontend workspaces.

### 10.7 `packages/eslint-config` & `typescript-config`
- **`@repo/eslint-config`**: Shared ESLint rules across Next.js, React, and Node workspaces.
- **`@repo/typescript-config`**: Shared base `tsconfig.json` configurations.

---

## 11. Environment Variables & Configuration Matrix

### `apps/backend/.env`
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Container (Docker Port 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sih_db?schema=public"

# JWT Token Secrets (Minimum 32 random characters)
JWT_ACCESS_SECRET="super-secret-access-token-key-change-in-prod-1234"
JWT_REFRESH_SECRET="super-secret-refresh-token-key-change-in-prod-5678"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Resend Email Service
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="onboarding@resend.dev"
```

### `packages/database/.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sih_db?schema=public"
```

---

## 12. Local Setup, Docker & Developer Runbook

### 12.1 Prerequisites
- **Docker Desktop** (Engine 24+)
- **Bun** (v1.3.14+)
- **Node.js** (v20+ / v24)
- **Git**

---

### 12.2 Step-by-Step Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/SpoidyMon/SIH-2026.git
cd SIH-2026

# 2. Install monorepo dependencies
bun install

# 3. Start PostgreSQL container via Docker
docker compose up -d

# 4. Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp packages/database/.env.example packages/database/.env

# 5. Apply Prisma database migrations
bun run db:migrate

# 6. Generate Prisma client
bun run db:generate

# 7. Seed test accounts and sample mandi slots
bun --cwd apps/backend run seed:test-data

# 8. Start all development servers
bun run dev
```

---

### 12.3 Database Operations & Migrations

| Action | Command |
| :--- | :--- |
| **Apply Migrations** | `bun run db:migrate` |
| **Push Schema Changes** | `bun run db:push` |
| **Generate Prisma Client** | `bun run db:generate` |
| **Open Prisma Studio UI** | `bun run db:studio` (Opens on `http://localhost:5555`) |
| **Seed Test Fixtures** | `bun --cwd apps/backend run seed:test-data` |
| **Reset Database Data** | `docker compose down -v; docker compose up -d; bun run db:migrate` |

---

### 12.4 Automated Testing Suite (Vitest)

```bash
# Run all backend unit and RBAC integration tests (41+ tests)
bun --cwd apps/backend test

# Run tests in watch mode
bun --cwd apps/backend test:watch

# Static type checking across all monorepo workspaces
bun run check-types

# Monorepo linting
bun run lint
```

---

### 12.5 Monorepo Command Dictionary

| Workspace | Command | Description |
| :--- | :--- | :--- |
| **Root** | `bun run dev` | Runs all 4 monorepo apps concurrently via Turborepo |
| **Root** | `bun run build` | Builds all packages and production bundles |
| **Root** | `bun run check-types` | Executes TypeScript compiler checks across all workspaces |
| **Root** | `bun run format` | Runs Prettier code formatting on `.ts`, `.tsx`, and `.md` files |
| **Backend** | `bun run --cwd apps/backend dev` | Starts Express backend server on `http://localhost:4000` |
| **Backend** | `bun run --cwd apps/backend test` | Executes Vitest test suite |
| **Landing** | `bun run --cwd apps/landing dev` | Starts Next.js landing app on `http://localhost:3000` |
| **Frontend** | `bun run --cwd apps/frontend dev` | Starts Agrovia React client on `http://localhost:5173` |
| **F-Test** | `bun run --cwd apps/f-test dev` | Starts interactive API sandbox on `http://localhost:5174` |

---

## 13. Standard Error Code Dictionary for Frontend Engineers

All backend API errors follow a strict, predictable JSON schema:

```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "code": "ERROR_CODE_STRING",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Complete Error Code Mapping:

| Error Code | HTTP Status | Recommended UI Notification Message |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | 400 | Please check the entered fields for formatting errors. |
| `INVALID_OTP` | 400 | The OTP code entered is invalid or has expired. |
| `INVALID_RESET_TOKEN` | 400 | The password reset link or OTP has expired or already been used. |
| `INVALID_CREDENTIALS` | 401 | Incorrect email/phone or password. |
| `UNAUTHORIZED` | 401 | Your session has expired. Please login again. |
| `TOKEN_EXPIRED_OR_INVALID` | 401 | Session token expired. Auto-refreshing... |
| `REFRESH_TOKEN_EXPIRED` | 401 | Your session has expired. Please login again. |
| `TOKEN_REUSE_DETECTED` | 401 | Security alert: session invalidated. Please login again. |
| `ACCOUNT_NOT_VERIFIED` | 403 | Your account is not verified yet. Please enter the OTP sent to your email. |
| `FORBIDDEN_ROLE` | 403 | You do not have permission to access this resource. |
| `MANDI_NOT_APPROVED` | 403 | Access restricted. Mandi registration is pending platform admin approval. |
| `EMAIL_EXISTS` | 409 | An account with this email address already exists. |
| `PHONE_EXISTS` | 409 | An account with this phone number already exists. |
| `SLOT_FULL` | 409 | The selected arrival slot is fully booked. Please select another slot. |
| `TOO_MANY_REQUESTS` | 429 | Too many attempts. Please wait a few minutes before trying again. |
| `INTERNAL_SERVER_ERROR` | 500 | An unexpected server error occurred. Please try again later. |

---

## 14. Source Markdown Documentation Traceability Index

This master document consolidates, supersedes, and provides full traceability to all modular documentation across the repository:

| Document Path | Module / Subject Area | Key Topics Covered |
| :--- | :--- | :--- |
| [`agents.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/agents.md) | Core Standards | Functional programming, `interfaces/` rules, `@repo/database`, Git branch rules. |
| [`docs/auth_module/overview.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/auth_module/overview.md) | Auth Architecture | ER diagrams, token rotation sequence, and defensive threat mitigation. |
| [`docs/auth_module/api_reference.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/auth_module/api_reference.md) | Auth Endpoints | Registration, login, OTP verification, password reset payloads. |
| [`docs/auth_module/frontend_integration.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/auth_module/frontend_integration.md) | Auth UI Integration | Silent refresh interceptor, UI state flows, token storage rules. |
| [`docs/mandi_module/SummaryV1.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/SummaryV1.md) | Mandi V1 Reference | 4-stage lifecycle, `requireApprovedMandi`, slot allocation, QR gate verification. |
| [`docs/mandi_module/overview.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/overview.md) | Mandi Architecture | Yard models, gate pass workflows, APMC compliance. |
| [`docs/mandi_module/api_reference.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/api_reference.md) | Mandi Endpoints | Slot management, booking streams, KYC endpoints. |
| [`docs/mandi_module/frontend_integration.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/mandi_module/frontend_integration.md) | Mandi UI Flows | Glance dashboard banner, KYC submission form, QR scanner contract. |
| [`docs/farmer_module/api_integration.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/farmer_module/api_integration.md) | Farmer Integration | Farmer profile endpoints, Redux `farmerSlice` state. |
| [`docs/landing_page/design.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/landing_page/design.md) | Landing Page Design | Design tokens, color palette, typography, micro-animations, Lenis scroll. |
| [`docs/dashboard_module/render_optimization.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/dashboard_module/render_optimization.md) | UI Performance | Granular memoization, state isolation, requestAnimationFrame interpolation. |
| [`docs/how_to_start/getting_started.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/docs/how_to_start/getting_started.md) | Developer Setup | Prerequisites, Docker setup, migration commands, troubleshooting runbook. |
| [`AI_INSTRUCTIONS/module_auth/prompt.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/AI_INSTRUCTIONS/module_auth/prompt.md) | Requirements Prompt | Auth scope boundaries, role definitions, definition of done. |
| [`AI_INSTRUCTIONS/Mandi_BE/prompt2.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/AI_INSTRUCTIONS/Mandi_BE/prompt2.md) | Mandi Specifications | Slot engine, buffer calculations, booking pipeline. |
| [`AI_INSTRUCTIONS/Mandi_BE/prompt3.md`](file:///c:/Users/ADMIN/Desktop/SIH/SIH-2026/AI_INSTRUCTIONS/Mandi_BE/prompt3.md) | Gate Pass Engine | Token verification, weighbridge payout calculation. |

---
*End of Consolidated Master Project Context (Version 2)*
