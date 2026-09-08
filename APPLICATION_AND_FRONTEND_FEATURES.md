# Agrovia Platform — Complete Application & Frontend Features Specification

> **Repository**: `SIH-2026`  
> **Platform**: Agrovia / KrishiSetu (Digital APMC Mandi Ecosystem & Smart Farmer Slot Booking)  
> **Standards**: Monorepo (Turborepo + Bun), Strict KG Weight Units, Pure Functional Architecture  

---

## Executive Overview

The **Agrovia** digital ecosystem connects Indian farmers with APMC Mandis (agricultural produce market committees) to eliminate market yard congestion, provide transparent electronic gate passes, and enable rapid digital weighbridge settlements.

The platform consists of two primary user-facing interfaces:
1. **Farmer Web & Mobile Application (`apps/application/farmer-setu`)**: For farmers to discover mandis, check live crop prices, book arrival time-slots, and carry authentic electronic QR gate passes.
2. **Mandi Management Dashboard (`apps/frontend`)**: For Mandi operators and supervisors to manage arrival time slots, verify incoming trucks at the gate via camera QR scanning, record digital weighbridge readings, and execute direct settlements.
3. **Public Landing Platform (`apps/landing`)**: Public portal with live market price ticker and onboarding channels.
4. **Unified REST API Engine (`apps/backend`)**: High-performance Express + TypeScript API powering all applications with shared PostgreSQL database via Prisma ORM (`@repo/database`).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                AGROVIA PLATFORM                                  │
├──────────────────────────┬───────────────────────────┬───────────────────────────┤
│    FARMER APPLICATION    │      MANDI DASHBOARD      │      REST API ENGINE      │
│  (Farmer Setu / Mobile)  │  (Operator & Cockpit Web) │    (Express + Prisma)     │
│                          │                           │                           │
│ • Mandi Discovery & Maps │ • Capacity & Slot Mgmt    │ • JWT Session Rotation    │
│ • Real-time Spot Prices  │ • QR-Only Gate Check-in   │ • Role-Based Access Ctrl  │
│ • Slot Booking (KG only) │ • Digital Weighbridge     │ • Slot Quota Transactions │
│ • QR Gate Pass & Wallet  │ • Direct Trade Settlement │ • KG Standard Processing  │
│ • DBT Payout Slips       │ • Audit Reports & History │ • Live Price Feeds        │
└──────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## Part 1: Farmer Web & Mobile Application (`apps/application/farmer-setu`)

The Farmer Application is built with Expo / React Native Web, providing an identical experience across Android, iOS, and mobile web browsers.

### 1. Multi-Lingual Authentication & Onboarding
* **Phone & Email OTP Verification**: Instant OTP delivery (via Resend transactional email and SMS mock) for passwordless, friction-free login.
* **Biometric / PIN Session Storage**: Secure token persistence with automated token refresh interceptors.
* **Aadhaar / Farmer ID Verification**: Quick KYC verification to ensure legitimate farmer profiles.
* **Farmer Profile & Land Record Setup**:
  * Farmer full name, contact phone, and residential address (State, District, Taluka/Block).
  * Total farmland holding size in Acres/Hectares and soil type.
  * Primary and seasonal crops cultivated (e.g., Wheat, Mustard, Rice, Soyabean, Gram).
  * Bank Account & UPI ID registration for Direct Benefit Transfer (DBT) payments.

### 2. Live Agricultural Commodity & Market Price Ticker
* **Real-time Price Marquee**: Live spot rates and Minimum Support Price (MSP) comparison across major commodities:
  * Wheat (Kalyan Sona, Sharbati)
  * Rice / Paddy (Basmati, Non-Basmati)
  * Mustard / Rapeseed
  * Soyabean
  * Cotton
  * Maize
  * Gram (Chana)
* **Trend Indicators**: Visual indicators showing 24h price movements, MSP gap analysis, and peak demand indicators.

### 3. Weather & Agro-Advisory Widget
* **Live Micro-Climate Forecast**: Current temperature, humidity percentage, wind speed, and precipitation likelihood.
* **Logistics & Harvest Advisory**: Smart warnings advising farmers on optimal delivery days (e.g., rain alerts recommending tarpaulin covers for truck consignments).

### 4. Smart Mandi Discovery & Geospatial Map
* **Mandi Directory & Distance Calculation**: Auto-locates nearby APMC market yards with real-time distance in kilometers.
* **Interactive OpenStreetMap Viewer (`OpenStreetMapViewer.tsx`)**:
  * Geospatial map pins for all certified APMCs.
  * Interactive popup cards showing active commodities, working hours, and open slot counts.
  * Radius filter slider (5 km to 100 km).
* **Mandi Filter & Search Modal (`MandiFilterModal.tsx`)**:
  * Filter by accepted crops, state, and district.
  * Filter by available yard amenities:
    * Electronic Digital Weighbridge
    * Cold Storage Units
    * Certified Quality Assaying Lab
    * Soil Testing Lab
    * Covered Godowns / Grain Sheds
    * Farmer Rest House & Canteen
* **Mandi Detailed Dossier**: Comprehensive operational profile, today's arrival volume, gate status, and direct Google Maps navigation.

### 5. Intelligent Gate Slot Booking System (`SlotBookingModal.tsx`)
* **7-Day Rolling Calendar Strip (`DateSelectorStrip.tsx`)**: Visual date picker displaying slot availability for the upcoming week.
* **Dynamic Time Windows**: Selection between Morning (08:00–11:00), Mid-Day (11:00–14:00), Afternoon (14:00–17:00), and Evening (17:00–20:00).
* **Quota & Congestion Protection**: Real-time display of remaining truck capacities per slot, preventing gate gridlock.
* **Transport Vehicle Selection**:
  * Vehicle Type: Tractor Trolley, Mini Truck (Pickup/Tata Ace), Medium Truck, Heavy Multi-Axle Truck, Bullock Cart.
  * Vehicle Registration Number input for automated gate matching.
* **Strict KG Weight Standard**:
  * All lot estimates and capacities are entered, calculated, and displayed **strictly in KG (Kilograms)**.
  * Prohibits outdated Quintal measurements across all calculations.
* **Instant Digital Token Generation**:
  * Issues unique alphanumeric tokens (e.g., `8SEP-10AM-001` or `TKN-8472`).
  * Generates high-density QR Code encoding secure JSON metadata (`token`, `farmerId`, `farmerName`, `bookingId`, `mandiId`, `crop`).

### 6. Digital Gate Pass & Consignment Wallet (`BookingsSectionView.tsx`)
* **Consignment Lifecycle Tracking**:
  1. `PENDING`: Awaiting automated slot confirmation from Mandi.
  2. `ACCEPTED` / `CONFIRMED`: Official Gate Pass issued with active QR code.
  3. `VERIFIED`: Farmer has arrived at the Mandi gate; scanned and admitted.
  4. `COMPLETED`: Consignment weighed, moisture assayed, and payment settled.
  5. `REJECTED`: Consignment rejected at gate with specific recorded reason.
* **Electronic Gate Pass Card**:
  * Prominent QR Code for gatekeeper optical scanning.
  * One-tap Pass Download / Offline saving for areas with low mobile network connectivity.
  * Turn-by-turn gate instructions and designated entry lane.
* **Digital Settlement Slip & DBT Payout Receipt**:
  * Breakdown of Gross Weight, Tare Weight, and Net Weight (all in KG).
  * Moisture analysis deduction percentage.
  * Final rate per KG and total payout credited via direct bank transfer.

### 7. Farmer Settings & Application Preferences (`SettingsSectionView.tsx`)
* **Multi-Language Selector**: Toggle between English, Hindi (हिन्दी), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ), and Gujarati (ગુજરાતી).
* **SMS & Push Notifications**: SMS alerts for slot approvals, gate entry calls, and DBT credit confirmations.
* **Theme Customization**: Dark mode and light mode with high-contrast outdoor visibility.

---

## Part 2: Mandi Management Dashboard & Cockpit (`apps/frontend`)

The Mandi Frontend is a high-performance web cockpit engineered in React 19, Vite/Bun, Tailwind CSS, and Redux Toolkit for APMC Secretaries, Gate Operators, and Weighbridge Staff.

### 1. Multi-Step APMC Registration Wizard & Governance Auth
* **Step 1 — Mandi Identity**: APMC market yard name, official APMC code, secretary email, and mobile contact.
* **Step 2 — Geographic Mapping**: State, district, physical market yard address, and GPS coordinates (Latitude/Longitude) for map discovery.
* **Step 3 — Gate & Slot Capacity Configuration (`RegisterStep3Slots.tsx`)**:
  * Setup of standard arrival slot windows.
  * Daily truck limit and maximum tonnage capacity in KG.
  * Number of operational entry gates and electronic weighbridge lanes.
* **Step 4 — Commodities & Amenities**: Selection of supported grains, pulses, and oilseeds, plus facility checklists.
* **Super-Admin Approval Verification (`MandiVerificationStatusView.tsx`)**:
  * Real-time verification gate for new mandis.
  * Restricted cockpit access until state APMC administrators audit statutory compliance and activate the yard.

### 2. Operational Live Cockpit & Analytics Dashboard (`MandiDashboardView.tsx`)
* **Real-time KPI Metrics**:
  * **Today's Total Arrivals**: Number of farmer consignments scheduled vs arrived.
  * **Gate Waiting Queue**: Trucks currently verified and awaiting weighbridge assay.
  * **Daily Volume Handled**: Cumulative crop volume processed today strictly in **KG**.
  * **Total Trade Disbursed**: Total monetary payout settled to farmers today in ₹ (INR).
* **Live Gate Flow Timeline**: Visual hourly capacity gauge displaying peak rush hours and open buffer slots.

### 3. Consignment Bookings Management Table (`ConsignmentBookingsTable.tsx`)
* **Unified Consignment Data Grid**:
  * Farmer Name, Contact, and Origin District.
  * Arrival Time Slot & Vehicle Plate Number.
  * Crop Variety & Estimated Quantity in KG.
  * Current Status with color-coded badges (`PENDING`, `ACCEPTED`, `VERIFIED`, `COMPLETED`, `REJECTED`).
* **Instant Action Controls**:
  * `Accept / Confirm`: Approves pending booking and issues official gate token.
  * `Reject`: Rejects booking with required explanation (e.g., yard overcapacity, weather hazard).
  * `Verify Gate Pass`: Opens scanner to admit truck through the gate.
  * `Scan QR to Settle`: Opens weighbridge terminal for final weight intake and settlement.
* **Search & Deep Filters**: Instant search by Token ID, Farmer Name, Crop, or Vehicle Number.

### 4. Strict QR-Only Gate Arrival Scanner (`VerifyTokenModal.tsx` & `MandiGateScannerView.tsx`)
* **Live Camera Viewfinder**: High-framerate optical scanner (`html5-qrcode`) running on desktop webcams, tablet cameras, or mobile devices.
* **QR Image Upload Fallback**: Ability to scan printed pass screenshots or saved QR image files.
* **Strict QR-Only Enforcement**: Manual token input has been completely removed to prevent operator error or unauthorized gate bypass.
* **Target Farmer Binding Guard**:
  * Cross-references scanned QR payload with the selected consignment record.
  * Validates `token`, `farmerId`, and `mandiId`.
  * Instantly rejects any QR pass belonging to another farmer or another consignment with an explicit alert:
    > *"Farmer Mismatch! Scanned pass belongs to token '...'. Only the QR code for farmer [Name] can be verified for this entry."*
* **Automatic Status Transition**: Immediately advances booking from `ACCEPTED` to `VERIFIED` and logs gate entry timestamp.

### 5. Digital Weighbridge & Direct Trade Settlement (`WeighbridgeSettlementModal.tsx`)
* **Mandatory Farmer QR Verification Gate**:
  * Weighbridge controls are locked until the farmer's QR code is optically verified at the weighbridge station.
  * Guarantees that only the physical truck on the platform is settled.
* **Precision Weight Scale Inputs (KG Only)**:
  * **Gross Truck Weight (KG)**: Loaded vehicle on scale.
  * **Tare Truck Weight (KG)**: Empty vehicle weight.
  * **Automated Net Weight Calculation**: Formula `Net Weight = Gross KG - Tare KG`.
* **Assayed Quality & Moisture Input**:
  * Input for lab-tested moisture percentage (e.g., 11.5%).
  * Automatic deductions applied if moisture exceeds standard trade limits.
* **Automated Direct Trade Payout (DBT) Calculator**:
  * Dynamic calculation: `Net Weight KG × Rate per KG`.
  * Pre-configured rate standards based on crop type (Wheat, Rice, Mustard, etc.).
* **One-Click Settlement Finalization**:
  * Sets booking status to `COMPLETED`.
  * Generates digital settlement certificate and dispatches DBT payment confirmation.

### 6. Arrival Slot & Capacity Manager (`MandiSlotsView.tsx`)
* **Time-Slot Grid Configuration**: Configure custom operational windows (e.g., 8 AM–11 AM, 11 AM–2 PM).
* **Dynamic Capacity Limits**: Set maximum vehicle quotas and maximum lot weight limits in KG per slot.
* **Emergency Slot Toggle**: Enable or disable specific slots during unseasonal rainfall or equipment maintenance.

### 7. Consignment Ledger & Audit History (`MandiHistoryView.tsx`)
* **Comprehensive Historical Ledger**: Filterable historical archive of all completed, verified, and rejected consignments.
* **Exportable APMC Reports**: Download transaction spreadsheets (CSV/Excel) for government market committee audits.
* **Detailed Weighbridge Slips**: Searchable archive of past digital receipts with full gross/tare breakdowns.

### 8. Farmer CRM & Directory (`MandiFarmersView.tsx`)
* Directory of all farmers who have traded at this market yard.
* Historical delivery frequency, favored crop varieties, and total cumulative volume delivered (in KG).
* Direct communication and advisory dispatch.

### 9. Mandi Quality & Transparency Ratings (`MandiRatingView.tsx`)
* Multi-dimensional farmer review scorecard.
* Breakdown of ratings across:
  * Gate Entry Wait Time
  * Weighbridge Accuracy & Transparency
  * Payment & DBT Credit Speed
  * Staff Helpfulness and Canteen/Rest Facilities.

### 10. Mandi Facility & Profile Configuration (`MandiSettingsView.tsx`)
* Update market yard operating hours, entry gates, and holiday calendars.
* Manage operational facility tags (Electronic Weighbridge, Cold Storage, Quality Assaying Lab).
* Set current procurement floor prices and quality benchmark criteria per KG.

---

## Part 3: Public Landing & Marketing Platform (`apps/landing`)

* **Next.js 16 (App Router)** marketing and informational portal.
* **Smooth Inertia Scrolling**: Powered by Lenis for fluid, responsive visual storytelling.
* **Interactive APMC Digital Twin Preview**: Visual demonstration of how electronic tokens eliminate highway congestion.
* **Live Price Discovery Ticker**: Real-time mandi rates accessible to non-registered visitors.
* **Dual Onboarding Funnel**: Distinct entry points for Farmers ("Download Farmer App") and APMC Mandi Boards ("Register Your Mandi").

---

## Part 4: Backend REST API Service Architecture (`apps/backend`)

The backend is built as a pure functional REST API using Express 4, TypeScript, Bun, and Prisma ORM.

### 1. Architectural Guardrails
* **No OOP / No Classes**: All services, controllers, middlewares, and routes are written as pure, composable, testable functions.
* **Shared Database Layer (`@repo/database`)**: Global PrismaClient singleton with single source of truth schema.
* **Strict KG Weight Standard**: All database fields (`quantityKg`, `netWeightKg`, `ratePerKg`) calculate and store weights in KG.

### 2. Core API Endpoints Summary

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register user (FARMER / MANDI_OPERATOR / ADMIN) | Public |
| `POST` | `/api/v1/auth/login` | Login with email & password | Public |
| `POST` | `/api/v1/auth/refresh-token` | Rotate refresh token & issue new JWT access token | Authenticated |
| `POST` | `/api/v1/auth/send-otp` | Trigger 6-digit verification OTP | Public |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP for authentication | Public |
| `GET` | `/api/v1/users/me` | Fetch currently authenticated user profile | Authenticated |
| `GET` | `/api/v1/farmer/mandis` | Search and discover nearby certified mandis | Farmer |
| `GET` | `/api/v1/farmer/mandis/:id/slots` | Query open arrival slots & truck availability | Farmer |
| `POST` | `/api/v1/farmer/bookings` | Book arrival slot & generate electronic QR token | Farmer |
| `GET` | `/api/v1/farmer/bookings` | Retrieve farmer's booked passes & statuses | Farmer |
| `GET` | `/api/v1/mandi/profile` | Retrieve Mandi operational profile & settings | Mandi Operator |
| `GET` | `/api/v1/mandi/bookings` | Retrieve incoming consignment queue & arrivals | Mandi Operator |
| `PATCH` | `/api/v1/mandi/bookings/:id/status` | Update booking status (`ACCEPTED` / `REJECTED`) | Mandi Operator |
| `POST` | `/api/v1/mandi/verify-token` | Optically verify Gate Pass QR and admit truck | Mandi Operator |
| `POST` | `/api/v1/mandi/weighbridge-settle` | Record Gross/Tare weight in KG & issue payout | Mandi Operator |
| `GET` | `/api/v1/admin/mandis/pending` | Audit and review unapproved APMC registrations | Super Admin |
| `PATCH` | `/api/v1/admin/mandis/:id/verify` | Approve and officially activate market yard | Super Admin |

---

## Part 5: Feature Traceability & File Index

| Platform Component | Primary File Location | Technology Stack |
| :--- | :--- | :--- |
| **Farmer App Entry & Router** | [`apps/application/farmer-setu/src/app/index.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/application/farmer-setu/src/app/index.tsx) | Expo / React Native Web |
| **Farmer Dashboard & Quick Actions** | [`apps/application/farmer-setu/src/components/dashboard/DashboardMainView.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/application/farmer-setu/src/components/dashboard/DashboardMainView.tsx) | React Native Web |
| **Farmer Slot Booking Modal** | [`apps/application/farmer-setu/src/components/dashboard/SlotBookingModal.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/application/farmer-setu/src/components/dashboard/SlotBookingModal.tsx) | React Native Web |
| **Farmer Gate Pass & Wallet** | [`apps/application/farmer-setu/src/components/dashboard/BookingsSectionView.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/application/farmer-setu/src/components/dashboard/BookingsSectionView.tsx) | React Native Web |
| **Farmer Mandi Geospatial Map** | [`apps/application/farmer-setu/src/components/dashboard/OpenStreetMapViewer.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/application/farmer-setu/src/components/dashboard/OpenStreetMapViewer.tsx) | Leaflet / OpenStreetMap |
| **Mandi Cockpit Router** | [`apps/frontend/src/App.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/App.tsx) | React 19 + React Router |
| **Mandi Operational Dashboard** | [`apps/frontend/src/components/dashboard/MandiDashboardView.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/dashboard/MandiDashboardView.tsx) | React 19 + Tailwind CSS |
| **Mandi Consignments Table** | [`apps/frontend/src/components/dashboard/ConsignmentBookingsTable.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/dashboard/ConsignmentBookingsTable.tsx) | React 19 |
| **QR Gate Pass Scanner** | [`apps/frontend/src/components/dashboard/modals/VerifyTokenModal.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/dashboard/modals/VerifyTokenModal.tsx) | Html5Qrcode + Lucide |
| **Digital Weighbridge Settlement** | [`apps/frontend/src/components/dashboard/modals/WeighbridgeSettlementModal.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/dashboard/modals/WeighbridgeSettlementModal.tsx) | Html5Qrcode + React 19 |
| **Mandi Slot Quota Manager** | [`apps/frontend/src/components/slots/MandiSlotsView.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/slots/MandiSlotsView.tsx) | React 19 |
| **Mandi Historical Ledger** | [`apps/frontend/src/components/history/MandiHistoryView.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/frontend/src/components/history/MandiHistoryView.tsx) | React 19 |
| **Public Landing Platform** | [`apps/landing/app/page.tsx`](file:///Users/rupeshjagtap/projects/SIH/apps/landing/app/page.tsx) | Next.js 16 + Lenis Scroll |
| **Shared Prisma Schema** | [`packages/database/prisma/schema.prisma`](file:///Users/rupeshjagtap/projects/SIH/packages/database/prisma/schema.prisma) | Prisma ORM + PostgreSQL |
| **Backend REST API Controllers** | [`apps/backend/src/controllers/`](file:///Users/rupeshjagtap/projects/SIH/apps/backend/src/controllers/) | Express 4 + TypeScript |
