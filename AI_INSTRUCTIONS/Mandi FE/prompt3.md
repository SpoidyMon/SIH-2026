# Stitch UI Generation Prompt — Agrovia APMC Mandi Operator Dashboard

Use the following detailed prompt in Stitch (or any AI UI design engine) to generate the complete modern APMC Mandi Operator Dashboard.

---

```markdown
Design a modern, high-density, enterprise B2B SaaS CRM Dashboard for an Indian APMC Agricultural Mandi (Market Yard) Operator named "AgriMandi Portal".

### 1. Visual Identity, Color Palette & Theme
- **Primary Accent Color**: `#5CE65C` (Vibrant Agri-Green) used for active indicators, primary action buttons, key metrics, and progress bars.
- **Base Background**: `#FFFFFF` (Crisp pure white) with subtle light gray borders (`#E2E8F0` / `#E5E7EB`) and soft shadows (`shadow-xs` / `shadow-sm`).
- **Typography & High Contrast**: Dark black / slate (`#0F172A` / `#000000`) for high legibility, with `#475569` for secondary labels.
- **Status Colors**:
  - `PENDING`: Soft Amber background (`#FEF3C7`), dark amber text (`#B45309`), amber border (`#FCD34D`).
  - `ACCEPTED`: Soft Blue background (`#EFF6FF`), dark blue text (`#1D4ED8`), blue border (`#BFDBFE`).
  - `VERIFIED`: Soft Green background (`#F0FDF4`), forest green text (`#15803D`), green border (`#BBF7D0`).
  - `COMPLETED`: Soft Slate/Gray background (`#F1F5F9`), dark slate text (`#334155`).
  - `REJECTED`: Soft Red background (`#FEF2F2`), red text (`#B91C1C`).
- **Theme Support**: Design in crisp **Light Theme** by default, with an interactive **Light / Dark Theme Toggle** in the top navigation header.

---

### 2. Layout Structure (Based on Architecture Wireframe)

```
+-------------------------------------------------------------------------------------------------------------------------+
| [7] TOP HEADER: Logo ("AgriMandi Portal" + "MANDI OPERATOR")  ... [Light/Dark Theme Switch] [Profile Settings Dropdown]  |
+---------------------+---------------------------------------------------------------------------------------------------+
| [4] Mandi Dashboard | [2] MANDI INSIGHTS CARDS (4-column grid: Total Slots, Active Bookings, Yard Arrivals, Capacity %)  |
| [5] Manage Slots    |---------------------------------------------------------------------------------------------------|
| [6] Verification    | [3] FILTER & ACTION BAR: [CRNT/PREV B Tabs] [Search Bar] [Filter Dropdown] ... [QR/Token] [Default] |
|                     |---------------------------------------------------------------------------------------------------|
| [Settings] (Bottom) | [1] BOOKINGS LISTING TABLE (Columns: Booking/Token, Farmer, Crop, Quantity, Arrival, Status, Actions) |
+---------------------+---------------------------------------------------------------------------------------------------+
```

---

### 3. Detailed Component Breakdown

#### [7] Top Navigation Header
- **Left**:
  - Brand Mark: Rounded square icon in `#5CE65C` with white/black agricultural leaf / "M" symbol.
  - Title: **AgriMandi Portal** (bold, black) + Pill Badge: `MANDI OPERATOR` (with green border and `#5CE65C` tint).
  - Subtitle: `SIH 2026 • Real-time Slot & Arrival Management`.
- **Right**:
  - **Light / Dark Theme Toggle**: Sleek pill switcher with Sun / Moon icons.
  - System status indicator: `Backend: ● Online` (green dot) with refresh icon.
  - **Profile Settings Dropdown**: User avatar circle with initial, Operator Name (**Rupesh Sharma**), Mandi Subtitle (**Indore APMC Grain & Oilseed Market Yard**), and dropdown caret for profile settings and sign out.

#### Left Sidebar Navigation
- Navigation Items:
  - **[4] Mandi Dashboard**: Active by default with `#5CE65C` background, black bold text, and a live pending count badge (`1`).
  - **[5] Manage Slots**: Calendar icon, manages arrival time windows and capacity.
  - **[6] Verification Mandi**: ScanLine / ShieldCheck icon for gate pass token & QR validation.
  - **[Settings]** (Pinned at bottom): Settings icon for Mandi KYC, Aadhaar identity verification, and statutory APMC licenses.
- Pinned status widget: `APMC Terminal Active` with a green progress bar and label `System Ready • Automated Weighbridge Sync`.

#### [2] Mandi Insights (4-Card Metric Grid)
1. **Today's Total Slots**:
   - Header: `Today's Total Slots` with badge `🌾 Active Yard`.
   - Primary Metric: `2 Slots` (bold, 30px black).
   - Subtitle: `Across Wheat, Rice, Mustard`.
2. **Active Farmer Bookings**:
   - Header: `Active Farmer Bookings` with badge `📋 In Pipeline`.
   - Primary Metric: `3 Bookings` (bold, 30px black).
   - Subtitle: `1 awaiting approval`.
3. **Yard Arrivals Today**:
   - Header: `Yard Arrivals Today` with badge `🚛 Gate Verified`.
   - Primary Metric: `1 Arrivals` (bold, 30px black).
   - Subtitle: `0 completed weigh-ins`.
4. **Overall Capacity Utilized**:
   - Header: `Overall Capacity Utilized` with percentage indicator `36.1%`.
   - Progress bar: Clean rounded progress track with vibrant `#5CE65C` fill.
   - Subtitle: `Buffer tolerance active`.

#### [3] Actions & Filter Bar (Directly Matching Wireframe)
- Left to Right in a single cohesive toolbar:
  1. **CRNT / PREV B Switcher**: Pill tab switcher with `Current Bookings (3)` (active green pill) and `Previous Logs (2)` (neutral pill).
  2. **SEARCH BAR**: Clean input field with search icon (`Search by token, farmer, or commodity...`).
  3. **FILTER DROPDOWN**: Dropdown select with filter icon (`Filter Status: All`, `PENDING`, `ACCEPTED`, `VERIFIED`, `COMPLETED`, `REJECTED`).
  4. **QR / Token Action Button**: Prominent green button (`#5CE65C` background, black bold text) with QR code icon labeled `Verify QR / Token` to launch quick gate pass scanner.
  5. **DEFAULT SLOTS FOR CRNT TIME Button**: Secondary outline button (`Default Slots For Crnt Time` or `Default Slots`) with sparkles icon to auto-generate standard morning & afternoon arrival windows.

#### [1] Bookings Listing Data Table
*(Note: As specified, the Vehicle Number column is omitted to keep the table ultra-focused on trade & lot verification)*

- **Columns**:
  1. `BOOKING / TOKEN`: Monospace green token ID (e.g., **TKN-7821**) + Booking reference (e.g., `BK-98421`).
  2. `FARMER DETAILS`: Farmer name in bold black (e.g., **Baldev Singh**), contact number (`+91 98765 43210`), and farmer ID (`usr_farmer_01`).
  3. `CROP & VARIETY`: Commodity name in bold (e.g., **Wheat (Sharbati)**) and variety/grade tag (`Grade-A Export Quality`).
  4. `QUANTITY & %`: Volume in quintals (e.g., **45 Qtl**) and percentage of slot capacity (`9% of slot`).
  5. `ARRIVAL SLOT`: Allocated arrival window (e.g., **08:00 - 11:00**) and date (`2026-08-31`).
  6. `STATUS`: High-contrast colored pill badge (`ACCEPTED`, `PENDING`, `VERIFIED`, `COMPLETED`, `REJECTED`).
  7. `ACTIONS`: Context-aware action buttons:
     - For `PENDING`: Green **Accept** button + Red **Reject** button + **Details** (Eye icon).
     - For `ACCEPTED`: Purple/Indigo **Verify Entry** button + **Details** (Eye icon).
     - For `VERIFIED`: Green **Mark Complete** button (with scale icon for weighbridge gross/tare settlement) + **Details** (Eye icon).

---

### 4. Interactive Modals & Sub-Views
1. **Gate Verification Dialog (triggered by "QR / Token")**:
   - Barcode/QR input field with sample active tokens (`TKN-7821`, `TKN-3190`).
   - Summary card showing Farmer, Crop, Vehicle, Time Window, and Assigned Intake Dock.
   - Button: `Grant Gate Entry & Print Weighbridge Slip`.
2. **Weighbridge Settlement Modal (triggered by "Mark Complete")**:
   - Inputs for Gross Truck Weight (Kg), Tare Weight (Kg), Assayed Moisture (%).
   - Live calculation of Net Agricultural Quintals and Total Payout (₹).
   - Button: `Complete & Issue Settlement`.
3. **Manage Slots Sub-View**:
   - 3-column slot card grid (Wheat, Mustard, Rice, Soyabean) showing start/end time, capacity bars, farmer booking limits, and buffer tolerances.
   - Modal to create and edit arrival slot windows.
4. **Mandi & KYC Settings Sub-View**:
   - Operating yard address, Aadhaar KYC verification status, and certified APMC statutory licenses list with upload and verification badges.
```
