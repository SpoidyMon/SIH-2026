# Agrovia — Mandi Operator Frontend Features Specification

This document details all functional features, operational workflows, business logic, and capabilities implemented in the **AgriMandi Operator Frontend** (`apps/frontend`).

---

## 1. Authentication & Operator Session Management

- **Operator Login & Authentication**: Secure sign-in mechanism for verified APMC Mandi Operators.
- **Role-Based Access Control**: Strict client-side route and component protection restricting access exclusively to the `MANDI_OPERATOR` persona.
- **Session Persistence & Validation**: Automated session initialization on page reload via stored authentication tokens.
- **Graceful Offline / Standalone Fallback**: Built-in mock data state handlers ensuring full feature operability and demonstration capability even during backend downtime.
- **Secure Sign-Out**: Complete session termination and credential clearing.

---

## 2. System Health & Connectivity Monitoring

- **Live Backend Health Monitor**: Continuous monitoring of backend API connectivity via `/health` endpoint.
- **Manual Health Re-check**: One-click connection refresh to test and verify real-time server responsiveness.
- **Contextual Notification Center**: Real-time toast notifications for operational successes (status changes, gate verifications, settlements) and actionable error messages.

---

## 3. Mandi Dashboard & Real-Time Operational Analytics

### 3.1 Live Metric Indicators (Key Performance Indicators)
- **Today's Total Slots Tracking**: Displays the total count of active arrival windows open for the current operating day across supported commodities (Wheat, Mustard, Rice, etc.).
- **Active Farmer Bookings Pipeline**: Tracks total incoming consignment bookings and flags lots currently pending operator review and gate approval.
- **Yard Arrivals Today**: Real-time counter of consignments physically cleared through the yard gate versus completed weighbridge settlements.
- **Overall Capacity Utilization Tracker**: Real-time calculation and display of yard capacity utilization percentage, buffer tolerance status, and produce volume in Quintals allocated against maximum yard intake limit.

### 3.2 Consignment Filtering & Multi-Field Search
- **Pipeline vs. History Toggle**:
  - `Current Bookings`: Live consignments actively being processed through the intake and weighing pipeline.
  - `Previous Logs`: Completed and archived consignments.
- **Live Multi-Field Search Engine**: Real-time search across:
  - Token ID (e.g., `TKN-7821`)
  - Booking Reference ID (e.g., `BK-98421`)
  - Farmer Name
  - Farmer Mobile Number
  - Commodity / Crop Name
  - Crop Variety and Quality Grade
- **Lifecycle Status Filter**: Instant filtering by status:
  - `ALL`: View all records in current tab
  - `PENDING`: Bookings awaiting operator approval
  - `ACCEPTED`: Approved bookings awaiting physical yard arrival
  - `VERIFIED`: Lots cleared at the gate, awaiting weighbridge measurement
  - `COMPLETED`: Fully weighed, assayed, and settled lots
  - `REJECTED`: Declined bookings
- **One-Click Default Slot Preset Generator**: Instantly generates and activates standardized morning and afternoon arrival slot templates for current time windows.

---

## 4. Consignment Lifecycle & Gate Operations

### 4.1 Consignment Manifest Data Table
- **Token & Booking Association**: Displays the farmer's allocated electronic token ID alongside the system booking identifier.
- **Farmer Profile Manifest**: Displays the farmer's full name, registered mobile contact, and unique farmer ID.
- **Crop & Quality Grading**: Commodity identification with certified grading specification (e.g., Export Quality, Grade-B Certified, Premium Long Grain, Oilseed Special).
- **Quantity & Slot Share**: Estimated crop volume in Quintals and its calculated percentage share of the arrival slot capacity.
- **Arrival Scheduling**: Allocated time window (e.g., `08:00 - 11:00`) and scheduled arrival date.
- **Status Lifecycle State**: Current state of the consignment in the intake workflow.
- **Context-Aware Action Triggers**: Dynamic action controls tailored to the specific state of each consignment.

### 4.2 Booking Review & Approval Workflow
- **Accept Consignment**: Approves a `PENDING` booking request, reserving slot capacity and moving status to `ACCEPTED`.
- **Reject Consignment**: Prompts the operator to enter a rejection rationale (e.g., capacity overflow, grade incompatibility) and transitions status to `REJECTED`.

### 4.3 Gate Entry Verification Workflow
- **Verify Entry Trigger**: Available on `ACCEPTED` bookings to authorize vehicle gate pass.
- **Quick Token / QR Verification Modal**:
  - Manual Token ID input field or QR scan code submission.
  - Verification against active bookings database.
  - On authorization: Records arrival timestamp, validates allocated time window, and transitions booking status to `VERIFIED`.

### 4.4 Weighbridge Measurement & Final Settlement Workflow
- **Weighbridge Measurement Launch**: Available on `VERIFIED` consignments; opens settlement interface.
- **Dual-Stage Scale Input**:
  - **Loaded Gross Weight (Kg)**: Scale reading of loaded vehicle on weighbridge.
  - **Tare Truck Weight (Kg)**: Scale reading of empty vehicle post-unloading.
  - **Moisture Assay Percentage (%)**: Quality laboratory moisture test reading.
- **Automated Settlement Calculations**:
  - Certified Net Produce Weight: `(Gross Weight - Tare Weight) / 100` (Quintals).
  - Direct Trade Payout: `Net Quintals × Commodity MSP / Market Rate`.
- **Settlement Finalization**: Completes weighbridge processing, updates booking status to `COMPLETED`, archives produce metrics, and records direct payout advice.

### 4.5 Electronic Weighment & Settlement Advice Slip
- **Slip Generation**: Available on any `COMPLETED` consignment.
- **APMC Certified Slip Details**:
  - Unique Slip Number (e.g., `SLIP-98390-WGH`).
  - Arrival token ID and completion date/time stamp.
  - Farmer identity credentials and vehicle reference.
  - Consignment commodity, variety, and assigned yard.
  - Certified Scale Manifest: Loaded Gross Weight (Kg), Tare Vehicle Weight (Kg), Assayed Moisture Percentage (with compliance status), and Certified Net Quintals.
  - Direct Beneficiary Transfer (DBT) Escrow settlement total and escrow clearance status.
- **Slip Printing**: Physical slip printing via browser print dialog.

### 4.6 Booking Details & Gate Pass Drawer
- **Electronic Gate Pass Inspection**: Available via view action on any consignment.
- **Manifest Information**: Full farmer contact, vehicle reference, assigned arrival window, commodity specifications, and current status.
- **Gate Pass Printing**: Physical pass printing for physical yard documentation.

---

## 5. Arrival Slots Management (`MandiSlotsView`)

- **Slot Overview & Monitoring**: Complete list of all configured arrival slots (active, scheduled, past).
- **Slot Capacity Tracking**: Visual representation of booked volume versus maximum Quintals capacity, and registered farmer counts versus slot limit.
- **Slot Creation Workflow**:
  - Date and Operating Window (Start Time & End Time).
  - Target Commodity Selection (Wheat, Mustard, Rice, Soyabean, etc.).
  - Maximum Capacity (Quintals).
  - Maximum Farmers Allowed.
  - Buffer Time Configuration (minutes) for turnover management.
  - Buffer Tolerance Percentage (%) to accommodate intake fluctuations.
- **Default Presets Generation**: Automated generation of morning and afternoon operational slots.
- **Slot Deletion & Deactivation**: Slot removal with capacity validation.

---

## 6. Gate Scanner & Physical Check-In (`MandiGateScannerView`)

- **Camera-Based QR Scanner**: Visual viewfinder interface for scanning physical or digital farmer QR gate passes.
- **Manual Code Entry Fallback**: Direct token ID entry for manual gate validation.
- **Real-Time Token Authorization**: Instantly cross-checks token validity, checks arrival schedule compliance, flags unauthorized entries, and clears legitimate consignments.
- **Arrival Audit Log**: Immediate status feedback upon gate clearance.

---

## 7. Historical Consignment Records & Audit Logs (`MandiHistoryView`)

- **Comprehensive Consignment Archives**: Searchable repository of all finalized, fulfilled, and rejected bookings.
- **Multi-Parameter Historical Search**: Search historical consignments by token, crop, date, or farmer name.
- **Historical Weighment Slip Retrieval**: Ability to re-open, review, and re-print historical electronic weighment slips and payout advice.
- **Pagination Support**: Server-ready paginated data browsing for large-scale historical manifests.

---

## 8. APMC Mandi Profile & Statutory Compliance (`MandiSettingsView`)

- **Mandi Operating Profile**:
  - APMC Operating License Number.
  - Physical Yard Address, State, District, and PIN code.
  - Certified Weighbridge Count registered at the yard.
- **Aadhaar Identity Verification**:
  - Operator Aadhaar credential status verification and secure masked display.
  - KYC submission workflow.
- **Statutory Document Management**:
  - Upload compliance documents: Mandi Operating License, State APMC Registration, GST Compliance Certificate.
  - Document verification status tracking (`VERIFIED`, `PENDING`).
  - Document replacement and deletion.

---

## 9. Quality Rating & Farmer Review Center (`MandiRatingView`)

- **Aggregated Quality Score**: Overall Mandi rating (out of 5.0) computed from verified farmer interactions.
- **Rating Distribution Breakdown**: Transparent star distribution breakdown (5-star through 1-star).
- **Operational Performance KPIs**:
  - Gate Precision Rate (% of consignments processed without gate delay).
  - Average Gate Waiting Time (in minutes).
- **Verified Farmer Reviews Feed**: Chronological list of farmer reviews including farmer name, numerical rating, written feedback comment, transaction date, and commodity traded.
