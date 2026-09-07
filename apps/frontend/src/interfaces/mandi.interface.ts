export type MandiApprovalStatus =
  | "PENDING_ONBOARDING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "REQUIRES_DOCUMENTS";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ARRIVED"
  | "VERIFIED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type LegalDocType =
  | "MANDI_LICENSE"
  | "APMC_REGISTRATION"
  | "GST_CERTIFICATE"
  | "OTHER";

export interface MandiLegalDoc {
  id: string;
  mandiId?: string;
  mandiProfileId?: string;
  documentType: LegalDocType;
  documentUrl: string;
  documentNumber?: string | null;
  verified: boolean;
  createdAt: string;
  title?: string;
  docType?: string;
  status?: string;
  uploadedAt?: string;
  fileUrl?: string;
}

export interface MandiProfile {
  id: string;
  userId: string;
  mandiName?: string | null;
  apmcCode?: string | null;
  address?: string | null;
  yardAddress?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  weighbridgeCount?: number | null;
  operatingLicense?: string | null;
  operatingHours?: string | null;
  aadhaarNumber?: string | null;
  aadhaarVerified: boolean;
  aadhaarDocUrl?: string | null;
  avatarUrl?: string | null;
  approvalStatus: MandiApprovalStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  legalDocs?: MandiLegalDoc[];
}

export interface MandiSlot {
  id: string;
  mandiId?: string;
  mandiProfileId?: string;
  crop: string;
  date: string; // YYYY-MM-DD
  slotDate?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalCapacityQuintals: number;
  maxCapacityQuintals?: number;
  bookedCapacityQuintals: number;
  capacityPercentage?: number;
  maxFarmers: number;
  maxFarmersLimit?: number;
  bookedFarmers?: number;
  currentFarmersBooked?: number;
  availableBookings?: number;
  bufferMinutes: number;
  bufferTimeMinutes?: number;
  bufferPercentage: number;
  bufferTolerancePercentage?: number;
  status?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  mandiId?: string;
  mandiProfileId?: string;
  mandiName?: string;
  slotId: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  crop: string;
  variety?: string;
  quantityQuintals?: number;
  estimatedQuantityQuintals?: number;
  vehicleNumber?: string | null;
  arrivalDate?: string;
  slotTimeWindow?: string;
  token: string; // TKN-XXXX
  qrCodeUrl?: string | null;
  qrCodeString?: string | null;
  gateEntryTimestamp?: string | null;
  status: BookingStatus;
  notes?: string | null;
  actualGrossWeightKg?: number | null;
  tareWeightKg?: number | null;
  finalNetWeightQuintals?: number | null;
  moisturePercentage?: number | null;
  actualWeightQuintals?: number | null;
  finalPayoutAmount?: number | null;
  verifiedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  farmer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  slot?: {
    date: string;
    startTime: string;
    endTime: string;
    crop: string;
  };
}

export interface MandiDashboardStats {
  mandiId?: string;
  approvalStatus: MandiApprovalStatus;
  isApproved?: boolean;
  todayArrivalsCount: number;
  todayTotalQuintals: number;
  activeSlotsCount: number;
  pendingBookingsCount?: number;
  pendingCount?: number;
  verifiedCount: number;
  completedCount?: number;
  capacityPercentage?: number;
  completedTodayPayouts: number;
  rating?: number;
  mandiName?: string | null;
  apmcCode?: string | null;
}

export interface MandiRatingData {
  rating: number;
  averageRating?: number;
  totalReviews: number;
  gatePrecisionPercentage?: number;
  averageGateWaitMinutes?: number;
  breakdown?: Record<number, number>;
  reviews: Array<{
    id: string;
    farmerName: string;
    rating: number;
    comment: string;
    date?: string;
    crop?: string;
    createdAt?: string;
  }>;
}

export interface CreateSlotPayload {
  crop: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacityQuintals: number;
  maxFarmers: number;
  bufferMinutes?: number;
  bufferPercentage?: number;
}

export interface OnboardingPayload {
  mandiName: string;
  apmcCode: string;
  address: string;
  district: string;
  state: string;
  operatingHours: string;
  operatingCommodities: string[];
}

export interface AadhaarKycPayload {
  aadhaarNumber: string;
  aadhaarDocUrl: string;
}

export interface LegalDocPayload {
  documentType: LegalDocType;
  documentUrl: string;
  documentNumber?: string;
}

export interface CompleteBookingPayload {
  actualWeightQuintals: number;
  finalPayoutAmount: number;
}
