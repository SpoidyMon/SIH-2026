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
  mandiCode?: string | null;
  apmcCode?: string | null;
  address?: string | null;
  yardAddress?: string | null;
  pincode?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  closedDays?: string[];
  closedHours?: string | null;
  isLocationSet?: boolean;
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

export interface SlotCropItem {
  crop: string;
  quantityKg?: number;
  quantityQuintals?: number;
  ratePerKg?: number;
  instructions?: string;
  isFixed?: boolean;
}

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface CustomSlotItem {
  id: string;
  name: string; // e.g. "Slot 1"
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "13:30"
  maxFarmers: number;
  crops: Array<{
    crop: string;
    quantityKg: number;
    ratePerKg: number;
  }>;
  instructions?: string;
}

export interface DayMandiConfig {
  day: DayOfWeek;
  enabled: boolean;
  startTime: string; // e.g. "9:00 AM" or "09:00"
  endTime: string;   // e.g. "5:00 PM" or "17:00"
  capacityQuintals: number;
  totalCapacityKg?: number;
  maxFarmers: number;
  bufferMinutes: number;
  bufferPercentage: number;
  selectedCrops: string[];
  customSlots?: CustomSlotItem[];
  defaultInstructions?: string;
  isExpanded?: boolean;
}

export interface MandiSlot {
  id: string;
  mandiId?: string;
  mandiProfileId?: string;
  crop: string;
  allowedCrops?: SlotCropItem[] | null;
  instructions?: string | null;
  date: string; // YYYY-MM-DD
  slotDate?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalCapacityQuintals: number;
  totalCapacityKg?: number | null;
  maxCapacityQuintals?: number;
  bookedCapacityQuintals: number;
  bookedCapacityKg?: number | null;
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
  cropsList?: Array<{
    crop: string;
    quantityKg: number;
    ratePerKg?: number;
    estimatedAmount?: number;
  }> | null;
  quantityKg?: number | null;
  quantityQuintals?: number;
  estimatedQuantityQuintals?: number;
  estimatedPayout?: number | null;
  vehicleNumber?: string | null;
  arrivalDate?: string;
  slotTimeWindow?: string;
  token: string; // TKN-XXXX or 4MAY-10AM-001
  queueNumber?: number;
  qrCodeData?: string | null;
  qrCodeUrl?: string | null;
  qrCodeString?: string | null;
  gateEntryTimestamp?: string | null;
  status: BookingStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  actualGrossWeightKg?: number | null;
  tareWeightKg?: number | null;
  finalNetWeightQuintals?: number | null;
  moisturePercentage?: number | null;
  actualWeightQuintals?: number | null;
  finalPayoutAmount?: number | null;
  verifiedAt?: string | null;
  servedAt?: string | null;
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
  todayArrivalsCount?: number;
  todayTotalQuintals?: number;
  activeSlotsCount?: number;
  pendingBookingsCount?: number;
  pendingCount?: number;
  verifiedCount?: number;
  completedCount?: number;
  capacityPercentage?: number;
  completedTodayPayouts?: number;
  totalSlotsToday?: number;
  activeBookings?: number;
  arrivalsToday?: number;
  completedToday?: number;
  pendingApprovals?: number;
  acceptedCount?: number;
  netTurnoverLakhs?: number;
  avgSettlementMins?: number;
  rating?: number;
  mandiName?: string | null;
  apmcCode?: string | null;
  mandiCode?: string | null;
  metrics?: {
    totalSlotsToday: number;
    activeBookings: number;
    arrivalsToday: number;
    completedToday: number;
    pendingApprovals: number;
    acceptedCount?: number;
    totalCapacityUtilizedPercentage: number;
    netTurnoverLakhs?: number;
    avgSettlementMins?: number;
  };
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
  allowedCrops?: SlotCropItem[];
  instructions?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacityQuintals?: number;
  totalCapacityKg?: number;
  maxFarmers: number;
  bufferMinutes?: number;
  bufferPercentage?: number;
}


export interface OnboardingPayload {
  mandiName: string;
  apmcCode: string;
  address: string;
  pincode?: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  operatingHours: string;
  closedDays?: string[];
  closedHours?: string;
  operatingCommodities: string[];
}

export interface UpdateMandiLocationPayload {
  address: string;
  pincode: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  operatingHours?: string;
  closedDays?: string[];
  closedHours?: string;
}

export interface FarmerDetails {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  farmerCode?: string | null;
  dob?: string | null;
  address?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  village?: string | null;
  taluka?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  landSizeAcres?: number | null;
  mainCrops?: string[];
  secondaryCrops?: string[];
  irrigationType?: string | null;
  avatarUrl?: string | null;
  totalBookingsCount: number;
  verifiedBookingsCount: number;
}

export interface VerifyTokenResponse {
  booking: Booking;
  isOutOfOrder?: boolean;
  nextInQueueToken?: string;
  warningMessage?: string | null;
}

export type NavTab =
  | "dashboard"
  | "bookings"
  | "slots"
  | "scanner"
  | "verification"
  | "farmers"
  | "history"
  | "settings"
  | "rating";

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

export interface VerifyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => void;
  initialToken?: string;
}

export interface WeighbridgeSettlementModalProps {
  booking: Booking | null;
  onClose: () => void;
  onComplete: (bookingId: string, actualWeightQuintals: number, finalPayoutAmount: number) => void;
  isPreVerified?: boolean;
}

