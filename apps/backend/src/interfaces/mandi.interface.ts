import {
  BookingStatus,
  MandiApprovalStatus,
  LegalDocType,
  DocVerificationStatus,
} from "@prisma/client";

// Augment Express Request interface with Mandi context
declare global {
  namespace Express {
    interface Request {
      mandiProfile?: MandiProfileDto | null;
      mandiApprovalStatus?: MandiApprovalStatus;
    }
  }
}

// Mandi Profile DTOs & Models
export interface MandiProfileDto {
  id: string;
  userId: string;
  mandiName?: string | null;
  mandiCode?: string | null;
  apmcCode?: string | null;
  address?: string | null;
  pincode?: string | null;
  district?: string | null;
  state?: string | null;
  operatingHours?: string | null;
  closedDays?: string[];
  closedHours?: string | null;
  isLocationSet?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  aadhaarNumber?: string | null;
  aadhaarVerified: boolean;
  aadhaarDocUrl?: string | null;
  avatarUrl?: string | null;
  approvalStatus: MandiApprovalStatus;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MandiOnboardingInput {
  mandiName: string;
  apmcCode: string;
  address: string;
  pincode?: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  closedDays?: string[];
  closedHours?: string;
  aadhaarNumber: string;
  aadhaarDocUrl?: string;
  legalDocs?: {
    name: string;
    type: LegalDocType;
    fileUrl?: string;
  }[];
}

export interface AdminApprovalInput {
  status: MandiApprovalStatus;
  rejectionReason?: string;
}

export interface UpdateMandiProfileInput {
  mandiName?: string;
  address?: string;
  pincode?: string;
  district?: string;
  state?: string;
  operatingHours?: string;
  closedDays?: string[];
  closedHours?: string;
  apmcCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMandiLocationInput {
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

export interface FarmerDetailsForMandi {
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

export interface AadhaarKycInput {
  aadhaarNumber: string;
  aadhaarDocUrl?: string;
}

export interface LegalDocUploadInput {
  name: string;
  type: LegalDocType;
  fileUrl?: string;
}

// Mandi Slot DTOs & Models
export interface SlotCropItem {
  crop: string;
  quantityQuintals?: number;
  isFixed?: boolean;
}

export interface CreateSlotInput {
  crop: string;
  allowedCrops?: SlotCropItem[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalCapacityQuintals: number;
  maxFarmers: number;
  bufferMinutes?: number;
  bufferPercentage?: number;
}

export interface UpdateSlotInput {
  crop?: string;
  allowedCrops?: SlotCropItem[];
  date?: string;
  startTime?: string;
  endTime?: string;
  totalCapacityQuintals?: number;
  maxFarmers?: number;
  bufferMinutes?: number;
  bufferPercentage?: number;
  isActive?: boolean;
}

export interface SlotFilterQuery {
  date?: string;
  crop?: string;
  isActive?: boolean;
}

export interface MandiSlotDto {
  id: string;
  mandiProfileId: string;
  crop: string;
  allowedCrops?: SlotCropItem[] | null;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacityQuintals: number;
  bookedCapacityQuintals: number;
  capacityPercentage: number;
  maxFarmers: number;
  bookedFarmers: number;
  availableBookings: number;
  bufferMinutes: number;
  bufferPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking DTOs & Models
export interface UpdateBookingStatusInput {
  status: BookingStatus;
  notes?: string;
}

export interface VerifyQrTokenInput {
  token: string;
}

export interface CompleteBookingInput {
  finalWeightQuintals?: number;
  notes?: string;
}

export interface BookingFilterQuery {
  status?: BookingStatus | "ALL";
  crop?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BookingDto {
  id: string;
  token: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string | null;
  crop: string;
  variety?: string | null;
  quantityQuintals: number;
  capacityPercentage: number;
  slotId: string;
  slotTime?: string;
  slotDate?: string;
  vehicleNumber?: string | null;
  status: BookingStatus;
  notes?: string | null;
  verifiedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard & Analytics DTOs
export interface DashboardMetricsDto {
  totalSlotsToday: number;
  activeBookings: number;
  arrivalsToday: number;
  completedToday: number;
  pendingApprovals: number;
  totalCapacityUtilizedPercentage: number;
}

export interface MandiDashboardData {
  metrics: DashboardMetricsDto;
  mandi: {
    id: string;
    mandiName: string;
    apmcCode: string;
    rating: number;
    totalReviews: number;
    approvalStatus: MandiApprovalStatus;
    isApproved: boolean;
  };
}

export interface MandiRatingDto {
  rating: number;
  totalReviews: number;
  weighInPrecisionPercentage: number;
  avgGateWaitMinutes: number;
  reviews: {
    id: string;
    farmerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
}
