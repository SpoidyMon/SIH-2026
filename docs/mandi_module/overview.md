# Mandi Module — System Overview (V1)

> **Location**: `apps/backend/src/routes/mandi.routes.ts`  
> **Database Models**: `MandiProfile`, `MandiSlot`, `Booking`, `MandiLegalDoc` in `packages/database/prisma/schema.prisma`

---

## 1. Core Purpose

The Mandi Module provides APMC Market Yards with a modern digital infrastructure for:
1. **Intake Flow Management**: Allocating crop arrival slots with dynamic buffer timing and percentage safety limits.
2. **Gate Entry & Verification**: Rapid QR-based and 8-character token verification (`TKN-XXXX`) at market entry gates.
3. **Electronic Weighbridge Processing**: Recording actual weighed quantities and calculating instant payouts.
4. **Statutory Compliance & Accreditation**: Seamless operator Aadhaar verification, license document storage, and administrator audit reviews.

---

## 2. Key Architectural Pillars

- **Pure Functions Only**: Controllers, services, and middlewares are stateless, pure exported functions. Zero OOP classes.
- **Strict Role-Based Access Control (RBAC)**: All endpoints require authentication and `Role.MANDI_OPERATOR`.
- **Policy Enforcement (`requireApprovedMandi`)**:
  - Unapproved mandis receive read-only **Glance Dashboard** access.
  - Operational write actions (`/slots`, `/bookings/verify`, `/bookings/:id/complete`) are blocked with `403 FORBIDDEN (MANDI_NOT_APPROVED)` until an Administrator verifies the account.
- **Shared Monorepo Database**: Uses `@repo/database` for unified Prisma migrations and types.

---

## 3. Module File Structure

### Backend Core (`apps/backend/`)
```text
apps/backend/src/
├── controllers/
│   ├── mandi.controller.ts     # HTTP handlers for slots, bookings, KYC, onboarding
│   └── admin.controller.ts     # Handlers for admin approval and review
├── interfaces/
│   ├── mandi.interface.ts      # DTOs, Express Request augmentation
│   └── index.ts                # Barrel exports
├── middlewares/
│   ├── auth.middleware.ts      # authenticate, requireRole, requireApprovedMandi
│   └── validate.middleware.ts  # Zod schema validation middleware
├── routes/
│   ├── mandi.routes.ts         # /api/v1/mandi/* router
│   └── admin.routes.ts         # /api/v1/admin/* router
├── schemas/
│   └── mandi.schema.ts         # Zod schemas for slots, bookings, KYC, onboarding
├── services/
│   └── mandi.service.ts        # Pure business logic functions
└── scripts/
    └── seed.ts                 # Database seed script for test data
```

### Frontend Operator Portal (`apps/frontend/`)
```text
apps/frontend/src/
├── components/
│   ├── layout/MandiLayout.tsx                 # Navigation sidebar, header & dark theme toggle
│   ├── dashboard/MandiDashboardView.tsx      # Metrics, commodity pipelines, dual bookings table
│   ├── slots/MandiSlotsView.tsx              # Slot window configuration & buffer tolerance
│   ├── gate/MandiGateScannerView.tsx         # Token barcode scanner & intake bay statuses
│   ├── verification/MandiVerificationStatusView.tsx # Aadhaar KYC, legal docs & ID badges
│   ├── farmers/MandiFarmersView.tsx          # Verified farmer directory & historical volumes
│   ├── rating/MandiRatingView.tsx            # Farmer reviews & gate precision metrics
│   └── settings/MandiSettingsView.tsx        # Yard facility address & statutory licenses
├── store/slices/mandiSlice.ts                # Redux Toolkit state, async thunks & offline fallbacks
└── services/mandi.api.ts                     # Axios client integration
```

---

## 4. Documentation Index

- [Frontend Specification (`frontend_specification.md`)](./frontend_specification.md) — Comprehensive functional guide for the web portal.
- [Frontend Integration Guide (`frontend_integration.md`)](./frontend_integration.md) — API client connection, authentication, and error codes.
- [API Reference (`api_reference.md`)](./api_reference.md) — REST endpoint schemas, payloads, and responses.
- [Technical Summary V1 (`SummaryV1.md`)](./SummaryV1.md) — Complete architectural and operational reference.

