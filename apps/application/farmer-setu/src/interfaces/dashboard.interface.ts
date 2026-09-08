import type { MandiSlotData } from './farmer.interface';

export type NavTabType = 'dashboard' | 'mandi' | 'bookings' | 'settings';

export type StatColorTheme = 'mint' | 'peach' | 'lavender' | 'softGray';

export interface StatCardItem {
  id: string;
  title: string;
  value: string;
  unit?: string;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  colorTheme: StatColorTheme;
  iconName: string;
  subtitle?: string;
  progressPercent?: number;
  badgeLabel?: string;
}

export type BookingStatus = 'in_progress' | 'confirmed' | 'completed' | 'cancelled' | 'PENDING' | 'ACCEPTED' | 'ARRIVED' | 'WEIGHED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface BookingItem {
  id: string;
  bookingCode: string;
  token?: string;
  queueNumber?: number;
  qrCodeData?: string;
  cropName: string;
  cropVariety: string;
  cropsList?: Array<{
    crop: string;
    variety?: string;
    quantityKg: number;
    ratePerKg?: number;
    estimatedPayout?: number;
  }>;
  mandiName: string;
  mandiCode?: string;
  gateNo: string;
  dateString: string;
  timeSlot: string;
  status: BookingStatus | string;
  statusLabel: string;
  progressPercent: number;
  progressLabel: string;
  inspectorName?: string;
  inspectorAvatar?: string;
  quantityKg?: number;
  quantityQuintals: number;
  rejectionReason?: string;
  estimatedPayout?: number;
  finalPayoutAmount?: number;
  commentsCount?: number;
  vehicleNumber?: string;
}

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  accentColor: 'lavender' | 'mint' | 'peach';
  actionLabel: string;
}

export interface MandiItem {
  id: string;
  name: string;
  mandiCode?: string;
  apmcCode?: string;
  district: string;
  distanceKm: number;
  topCrop: string;
  acceptedCrops?: string[];
  modalPrice: string;
  priceTrend: string;
  trendDirection: 'up' | 'down';
  estimatedQueueTime: string;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  todayArrivalsQtl?: number;
  operatingHours?: string;
  activeFarmersCount: number;
  address?: string;
  pincode?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatorName?: string;
  cropRates?: Array<{ crop: string; ratePerKg: number; availableKg: number }>;
  slots?: MandiSlotData[];
}

export interface MandiFilterCriteria {
  searchQuery: string;
  selectedCrop: string;
  selectedLocation: string;
  selectedDate: string;
  manualDate: string;
  manualCrop: string;
  minFarmers: string;
  timeSlot: string;
}

export interface BookingsFilterCriteria {
  searchQuery: string;
  selectedCrop: string;
  manualDate: string;
  manualCrop: string;
  minFarmers: string;
  status: string;
}

export type BookingViewMode = 'table' | 'cards';

export interface DayPickerItem {
  dayName: string;
  dayNumber: string;
  dateKey: string;
  isToday?: boolean;
}


