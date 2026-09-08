export type FarmerIdType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE';

export interface UpdateFarmerProfileInput {
  name?: string;
  phone?: string;
  dob?: string;
  address?: string;
  idType?: FarmerIdType;
  idNumber?: string;
  avatarUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landSizeAcres?: number | null;
  mainCrops?: string[];
  secondaryCrops?: string[];
  irrigationType?: string;
  farmLocation?: string;
}

export interface FarmerProfileData {
  id: string;
  userId: string;
  farmerCode: string | null;
  dob: string | null;
  address: string | null;
  idType: FarmerIdType | null;
  idNumber: string | null;
  avatarUrl: string | null;
  isProfileComplete: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  landSizeAcres: number | null;
  mainCrops: string[];
  secondaryCrops: string[];
  irrigationType: string | null;
  farmLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerFullProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  farmerProfile: FarmerProfileData | null;
  createdAt: Date;
  updatedAt: Date;
}export interface CreateFarmerBookingInput {
  mandiProfileId: string;
  slotId: string;
  crop?: string;
  variety?: string;
  quantityQuintals?: number;
  quantityKg?: number;
  cropsList?: Array<{
    crop: string;
    quantityKg: number;
    ratePerKg?: number;
    estimatedAmount?: number;
  }>;
  vehicleNumber?: string;
  notes?: string;
}
