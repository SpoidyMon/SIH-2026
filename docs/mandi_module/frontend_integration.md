# Frontend Integration Guide — Mandi Module V1

> **Target Audience**: Frontend Engineers building web, mobile, or kiosk interfaces for the Mandi Module.  
> **API Base URL**: `http://localhost:4000/api/v1`  
> **Auth Scheme**: Bearer JWT (`Authorization: Bearer <accessToken>`)

---

## 1. Authentication & Token Management

Store the access token returned on login or registration in memory/`localStorage`:
```typescript
// Standard headers for all authenticated Mandi requests:
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAccessToken()}`,
};
```

### Auto Token Refresh on `401 UNAUTHORIZED`:
When receiving a `401` response with `code: "INVALID_TOKEN"` or `"TOKEN_EXPIRED"`:
1. Dispatch `POST /api/v1/auth/refresh-token` with `{ refreshToken }`.
2. Update stored tokens and retry original request.
3. If refresh fails, clear tokens and redirect user to `/login`.

---

## 2. Handling the 4-Stage Mandi Onboarding & Approval Flow

### Step 1: Minimal Registration & Login
Initial signup requires only: `name`, `email`, `phone`, `password`, `role: "MANDI_OPERATOR"`.

### Step 2: Post-Login Glance Dashboard (`GET /api/v1/mandi/dashboard`)
Upon login, call `GET /api/v1/mandi/dashboard`. The backend returns:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalSlotsToday": 2,
      "activeBookings": 10,
      "arrivalsToday": 4,
      "completedToday": 2,
      "pendingApprovals": 3,
      "totalCapacityUtilizedPercentage": 45.2
    },
    "mandi": {
      "id": "clxyz...",
      "mandiName": "Indore APMC Yard",
      "apmcCode": "APMC-IND-042",
      "rating": 4.8,
      "totalReviews": 142,
      "approvalStatus": "PENDING_ONBOARDING",
      "isApproved": false
    }
  }
}
```

#### Frontend Handling:
- If `isApproved === false`:
  - Display the glance dashboard metrics with a top alert banner:
    > ⚠️ **Mandi Account Pending Verification (Glance View Only)**  
    > Please complete your Mandi & KYC Settings to submit for Administrator Approval.
  - Provide a primary button: **"Complete Mandi & KYC Settings →"** (navigates to Settings tab).
  - Disable slot creation, gate scanner, and transaction completion buttons (or display informational tooltips).

### Step 3: Mandi Profile & KYC Submission in Settings
When the operator submits their details in the Settings tab, call `POST /api/v1/mandi/onboarding`:
```typescript
const onboardingPayload = {
  mandiName: "Indore APMC Grain Yard",
  apmcCode: "APMC-IND-MP-042",
  address: "Plot 44, Industrial Area, Bypass Highway",
  district: "Indore",
  state: "Madhya Pradesh",
  operatingHours: "07:30 AM - 06:00 PM (Mon-Sat)",
  aadhaarNumber: "541289012345",
  aadhaarDocUrl: "https://vault.agrimarket.gov.in/docs/aadhaar.pdf",
  legalDocs: [
    {
      name: "APMC Mandi Operating License 2026",
      type: "MANDI_LICENSE",
      fileUrl: "https://vault.agrimarket.gov.in/docs/license.pdf"
    }
  ]
};
```
Upon success, the backend sets `approvalStatus: "PENDING_APPROVAL"`. The UI updates to show the **⏳ Admin Verification Pending** badge.

### Step 4: Graceful Error Handling for Restricted Actions (`403 MANDI_NOT_APPROVED`)
If an unapproved operator tries to call an operational endpoint (e.g. `POST /api/v1/mandi/slots`):
The backend returns `HTTP 403 Forbidden`:
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
**Frontend Action**: Catch `error.code === "MANDI_NOT_APPROVED"`, display a friendly toast/modal directing the user to Settings, and prevent UI crash.

---

## 3. Slot Management Integration

### Creating a Slot (`POST /api/v1/mandi/slots`)
```typescript
interface CreateSlotPayload {
  crop: string;                   // e.g. "Wheat (Sharbati)"
  date: string;                   // "YYYY-MM-DD"
  startTime: string;              // "08:00"
  endTime: string;                // "11:30"
  totalCapacityQuintals: number;  // 500
  maxFarmers: number;             // 20
  bufferMinutes?: number;         // default 15
  bufferPercentage?: number;      // default 10
}
```

### Applying Default Daily Presets (`POST /api/v1/mandi/slots/default-preset`)
Auto-generates morning (08:00 - 11:30) and afternoon (12:00 - 15:30) standard slots for the current yard.

---

## 4. Gate Entry QR / Token Verification (`POST /api/v1/mandi/bookings/verify`)

When an arriving farmer presents their digital QR or SMS token:
```typescript
// Request Body
{
  "tokenOrQr": "TKN-7842" // or full QR URL
}

// Successful Response (200 OK)
{
  "success": true,
  "message": "Gate entry authorized. Booking verified successfully.",
  "data": {
    "booking": {
      "id": "clxyz...",
      "token": "TKN-7842",
      "farmerName": "Ramesh Kumar",
      "farmerPhone": "+91 98765 43210",
      "crop": "Wheat (Sharbati)",
      "quantityQuintals": 45.5,
      "vehicleNumber": "MP-09-AB-1234",
      "status": "VERIFIED",
      "verifiedAt": "2026-08-30T16:00:00.000Z"
    }
  }
}
```

---

## 5. Weighbridge Settlement & Final Payout (`PATCH /api/v1/mandi/bookings/:id/complete`)

When weighing is complete at the electronic weighbridge:
```typescript
// Request Body
{
  "actualWeightQuintals": 46.2,
  "pricePerQuintal": 2450.00,
  "notes": "Grade A Quality Sharbati Wheat - Moisture 11.2%"
}

// Response (200 OK)
{
  "success": true,
  "message": "Weighbridge processing finalized and marked complete.",
  "data": {
    "bookingId": "clxyz...",
    "actualWeightQuintals": 46.2,
    "finalPayoutAmount": 113190.00,
    "status": "COMPLETED",
    "completedAt": "2026-08-30T16:30:00.000Z"
  }
}
```

---

## 6. Pre-Seeded Testing Accounts for Frontend Devs

| Scenario | Credentials | Expected UI State |
|---|---|---|
| **Full Operational Access** | `mandi.approved@agrimarket.gov.in` / `Password@123` | Dashboard unlocked, create slots enabled, gate scanner active. |
| **Pending Admin Approval** | `mandi.pending@agrimarket.gov.in` / `Password@123` | Glance dashboard banner shown; Settings shows submitted documents. |
| **Fresh Un-onboarded** | `mandi.new@agrimarket.gov.in` / `Password@123` | Glance dashboard directs to Settings to fill Mandi yard details. |

---

## 7. Production Frontend Implementation Reference

For component hierarchies, state models (`mandiSlice`), visual design specifications, and offline fallbacks, refer to:
- [Mandi Operator Frontend Portal Specification (`frontend_specification.md`)](./frontend_specification.md)

