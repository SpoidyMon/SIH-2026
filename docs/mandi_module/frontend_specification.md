# Mandi Operator Frontend Portal — Technical & Functional Specification

> **Package Location**: `apps/frontend`  
> **Target Audience**: Fullstack Engineers, UI/UX Designers, Product Managers  
> **Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Redux Toolkit + Lucide Icons

---

## 1. Executive Summary

The **AgriMandi Operator Portal** is the dedicated web application for verified APMC Mandi Operators. It equips yard managers with real-time operational tools to oversee crop arrivals, allocate daily intake capacity, verify incoming gate passes via tokens/QR codes, maintain statutory KYC compliance, and audit historical weighbridge transactions.

---

## 2. Visual Design System & Aesthetics

### Theme Architecture
- **Dual-Theme Support**: Instant switching between Light and Dark mode with persistence in local storage (`theme` key).
- **Pure Neutral Charcoal Palette (Dark Mode)**:
  - Background Canvas: Pure neutral dark `#0a0a0a` / `#000000` (strictly eliminating blue/slate undertones).
  - Surface Cards & Modals: Deep charcoal `#121212` and `#171717`.
  - Border Accents: Subdued neutral `#262626` / `neutral-800`.
  - Typography: High-contrast `#E5E5E5` headers, neutral `#a3a3a3` sub-labels.
- **Vibrant Accent Colors**:
  - Primary Action / Accent: Emerald Green (`#5CE65C`, hover `#4cd44c`, dark text `#15803D`).
  - Warning / In Progress: Warm Amber (`amber-500`, amber badge borders).
  - High Utilization / Danger: Crimson Red (`red-500`, red badge borders).
- **Zero Scrollbar Clutter**: Layout leverages inner container scrolling with hidden browser scrollbars (`no-scrollbar`) for an app-like dashboard experience.

---

## 3. Application Structure & Navigation

### Route & Layout Architecture (`MandiLayout.tsx`)
```text
apps/frontend/src/
├── components/
│   ├── layout/
│   │   └── MandiLayout.tsx                 # Persistent App Shell, Sidebar, Topbar
│   ├── auth/
│   │   └── AuthPage.tsx                    # Mandi Operator Login & Registration
│   ├── dashboard/
│   │   └── MandiDashboardView.tsx          # Real-time Metrics, Pipeline, Bookings Table
│   ├── slots/
│   │   └── MandiSlotsView.tsx              # Arrival Window & Capacity Management
│   ├── gate/
│   │   └── MandiGateScannerView.tsx        # Token Verification & Unloading Bays
│   ├── verification/
│   │   └── MandiVerificationStatusView.tsx # Aadhaar KYC, Legal Docs, Profile Photo
│   ├── farmers/
│   │   └── MandiFarmersView.tsx            # Farmer Directory & Transaction Logs
│   ├── rating/
│   │   └── MandiRatingView.tsx             # Reviews, Star Distribution, Gate KPIs
│   └── settings/
│       └── MandiSettingsView.tsx           # APMC Yard Address & Statutory Config
├── store/
│   ├── index.ts                            # Redux Store Configuration
│   └── slices/
│       ├── authSlice.ts                    # User session, JWT tokens, RBAC state
│       └── mandiSlice.ts                   # Slots, Bookings, Docks, KYC & Fallback Data
└── services/
    ├── apiClient.ts                        # Axios client with auto JWT injection
    ├── auth.api.ts                         # Login, registration, token refresh
    └── mandi.api.ts                        # Complete Mandi Module API endpoints
```

---

## 4. Module Views & Detailed Capabilities

### 1. Mandi Operations Dashboard (`MandiDashboardView.tsx`)
- **4 Key Operational Metrics**:
  - `Total Slots Today`: Active slot windows published for the day.
  - `Active Bookings`: Total farmers scheduled to arrive.
  - `Completed Today`: Vehicles weighed, verified, and settled.
  - `Capacity Utilized`: Aggregate yard tonnage percentage.
- **6 Commodity Pipeline Gauges**: Visual capacity meters for major crops (Wheat Sharbati, Mustard, Basmati Rice, Yellow Soyabean, Gram/Chana, Maize Hybrid) tracking booked vs. total available quintals.
- **Dual-Tab Bookings Management**:
  - **Current Bookings**: Real-time intake queue with status pills (`VERIFIED`, `IN_TRANSIT`, `WEIGHMENT_PENDING`), action buttons (Print Pass, Digital Weighment Slip, Complete Booking).
  - **Previous Logs**: Historical audit table. UI maintains consistent table container height without shrinking other dashboard panels when searching or filtering.
- **Modals**:
  - *Digital Pass Modal*: Printable digital gate pass with QR code, token code, arrival window, and QR string.
  - *Weighment Slip Modal*: Gross weight, tare weight, net weight, assayed moisture rate, and settled payout.

### 2. Arrival Slot Manager (`MandiSlotsView.tsx`)
- **Intake Windows**: Allows operators to define specific arrival time windows (e.g., `08:00 - 11:30`).
- **Safety Buffers**: Granular buffer time (minutes) and tolerance margin percentage to absorb weighbridge queues without gridlock.
- **Real-Time Capacity Tracker**: Progress bar dynamically reflects utilization (`bg-emerald-500` < 70%, `bg-amber-500` 70-85%, `bg-red-500` > 85%).
- **Native Dark Date Picker**: Standardized date input styled with `[color-scheme:dark]` and dark neutral styling.
- **Create / Edit Modal**: Form validating crop type, date, open/close times, capacity, max farmers limit, and tolerance buffers.

### 3. Electronic Gate Token Scanner (`MandiGateScannerView.tsx`)
- **Instant Token Lookup**: Rapid barcode or alphanumeric token search (e.g. `TKN-7821`).
- **Instant Verification**: Validates vehicle registration, farmer identity, allocated crop, and weight against active database records.
- **Live Unloading Bays & Hoppers**:
  - Status indicators for active intake bays (e.g. Wheat Hopper, Oilseed Pit, Coarse Grains Bay, Weighbridge Out).
  - Visual completion percentage bars for currently unloading vehicles.

### 4. Verification Hub (`MandiVerificationStatusView.tsx`)
Focused exclusively on operator credentials and compliance:
- **Aadhaar Identity Verification**:
  - Mandatory 12-digit Aadhaar input with e-Aadhaar PDF upload.
  - Live preview modal and verification status badge (`✓ Aadhaar Verified`).
- **Statutory APMC Legal Documents**:
  - Document classification: Mandi Operating License, APMC Registration, GST Certificate, Weighbridge Calibration Certificate.
  - Upload modal with certified file upload and instant listing.
- **Operator Profile Photo**:
  - Profile photo upload with instant image preview.
  - Mandi Officer ID badge preview with APMC accreditation code.

### 5. Farmer Directory (`MandiFarmersView.tsx`)
- Searchable directory of verified farmers trading with the APMC.
- Displays contact information, primary crops, aggregate tonnage supplied, and last arrival timestamp.

### 6. Ratings & Reputation (`MandiRatingView.tsx`)
- Transparent 5-star distribution chart.
- Key performance indicators: Gate Precision Rate and Average Waiting Times.
- Verified farmer feedback feed with transaction context.

---

## 5. State Management & Offline Resilience (`mandiSlice.ts`)

- **Asynchronous Thunks**: Integrated with backend endpoints via `createAsyncThunk` (`fetchDashboardThunk`, `fetchSlotsThunk`, `createSlotThunk`, `verifyGateTokenThunk`, `submitAadhaarKycThunk`, etc.).
- **Deterministic Mock Fallbacks**: When backend API is unavailable or offline, the store seamlessly initializes mock APMC yard state, ensuring error-free demonstration and zero UI blocking.
- **Optimistic UI Updates**: Dynamic addition and removal of slots, verification statuses, and legal documents in client memory.

---

## 6. How to Run Locally

```bash
# In SIH-2026 repository root:
bun install

# Start Frontend Dev Server:
bun run --cwd apps/frontend dev

# The portal will be available at:
# http://localhost:5173/
```
