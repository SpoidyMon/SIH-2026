import { apiClient } from "./apiClient";
import {
  FarmerMandiSummary,
  FarmerBookingRecord,
  CreateFarmerBookingPayload,
} from "../interfaces/farmer.interface";

/**
 * Fetches all approved mandis for farmer discovery, optionally with user coordinates and search filters
 */
export async function getApprovedMandisApi(
  userLat?: number,
  userLng?: number,
  search?: string,
  crop?: string
): Promise<FarmerMandiSummary[]> {
  const params: Record<string, string | number> = {};
  if (userLat !== undefined) params.latitude = userLat;
  if (userLng !== undefined) params.longitude = userLng;
  if (search) params.search = search;
  if (crop) params.crop = crop;

  const response = await apiClient.get<{ mandis: FarmerMandiSummary[] }>("/farmer/mandis", {
    params,
  });

  return response.data.data.mandis;
}

/**
 * Fetches all bookings created by the authenticated farmer
 */
export async function getFarmerBookingsApi(): Promise<FarmerBookingRecord[]> {
  const response = await apiClient.get<{ bookings: FarmerBookingRecord[] }>("/farmer/bookings");
  return response.data.data.bookings;
}

/**
 * Submits a new multi-crop booking request in KG
 */
export async function createFarmerBookingApi(
  payload: CreateFarmerBookingPayload
): Promise<FarmerBookingRecord> {
  const response = await apiClient.post<{ booking: FarmerBookingRecord }>("/farmer/bookings", payload);
  return response.data.data.booking;
}
