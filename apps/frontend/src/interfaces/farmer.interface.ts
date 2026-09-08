export type BookingStatusType =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ARRIVED"
  | "VERIFIED"
  | "COMPLETED"
  | "CANCELLED";

export interface CropBookingItem {
  crop: string;
  quantityKg: number;
  ratePerKg?: number;
  estimatedAmount?: number;
}

export interface FarmerMandiSummary {
  id: string;
  name: string;
  mandiCode: string;
  apmcCode?: string | null;
  district: string;
  address: string;
  pincode: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  topCrop: string;
  acceptedCrops: string[];
  modalPrice: string;
  priceTrend: string;
  trendDirection: string;
  estimatedQueueTime: string;
  activeFarmersCount: number;
  isOpen: boolean;
  operatingHours?: string;
  closedDays?: string[];
  closedHours?: string | null;
  slots?: Array<{
    id: string;
    crop: string;
    allowedCrops?: any;
    instructions?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    totalCapacityQuintals: number;
    totalCapacityKg?: number;
    availableBookings: number;
    maxFarmers: number;
    bookedFarmers: number;
    isActive: boolean;
  }>;
}

export interface CreateFarmerBookingPayload {
  mandiProfileId: string;
  slotId: string;
  cropsList: CropBookingItem[];
  notes?: string;
}

export interface FarmerBookingRecord {
  id: string;
  token?: string | null;
  queueNumber: number;
  farmerId: string;
  mandiProfileId: string;
  slotId: string;
  crop: string;
  cropsList?: CropBookingItem[] | null;
  quantityKg?: number | null;
  quantityQuintals: number;
  estimatedPayout?: number | null;
  qrCodeData?: string | null;
  status: BookingStatusType;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  mandiProfile?: FarmerMandiSummary;
  slot?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    crop: string;
    instructions?: string | null;
  };
}
