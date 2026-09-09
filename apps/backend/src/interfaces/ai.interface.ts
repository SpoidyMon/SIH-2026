export type AgentIntent =
  | "SEARCH_MANDI"
  | "VIEW_MANDI"
  | "VIEW_SLOTS"
  | "BOOK_SLOT"
  | "CONFIRM_BOOKING"
  | "VIEW_BOOKINGS"
  | "CANCEL_BOOKING"
  | "GREETING"
  | "GET_CROP_RATE"
  | "UNKNOWN";

export interface AgentCropInput {
  cropId?: string;
  name: string;
  quantityKg: number;
  ratePerKg?: number;
  estimatedAmount?: number;
}

export interface AgentSlotInfo {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  availableBookings: number;
  crop?: string;
}

export interface AgentMandiInfo {
  id: string;
  name: string;
  address?: string;
  pincode?: string;
  district?: string;
  state?: string;
  distanceKm?: number;
}

export interface BookingConfirmationPayload {
  mandiId: string;
  mandiName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  crop: string;
  quantityKg: number;
  ratePerKg: number;
  estimatedPayout: number;
  vehicleNumber?: string;
  remainingCapacity: number;
  idempotencyKey: string;
}

export interface BookingAgentState {
  userId: string;
  conversationId: string;
  language?: string;
  userMessage: string;
  intent?: AgentIntent;

  mandiQuery?: string;
  mandiId?: string;
  mandiInfo?: AgentMandiInfo;
  mandiMatches?: AgentMandiInfo[];

  date?: string;
  time?: string;
  slotId?: string;
  slotInfo?: AgentSlotInfo;
  availableSlots?: AgentSlotInfo[];

  crops?: AgentCropInput[];

  confirmationRequired: boolean;
  confirmed: boolean;
  confirmationPayload?: BookingConfirmationPayload;

  bookingId?: string;
  bookingToken?: string;
  bookingStatus?: string;

  historyMessages?: Array<{ sender: string; content: string; toolResults?: any }>;
  missingFields?: string[];
  responseText?: string;
  error?: string;
}

export interface AIProviderResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
}

export interface AIProvider {
  chatCompletion(messages: any[], tools?: any[]): Promise<AIProviderResponse>;
  transcribeAudio(audioBuffer: Buffer, filename?: string, languageHint?: string): Promise<string>;
}

export interface TextMessageInput {
  conversationId?: string;
  message: string;
  language?: string;
  confirmed?: boolean;
  idempotencyKey?: string;
  latitude?: number;
  longitude?: number;
}

export interface VoiceMessageInput {
  conversationId?: string;
  languageHint?: string;
  confirmed?: boolean;
  idempotencyKey?: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentResponsePayload {
  conversationId: string;
  transcript?: string;
  responseText: string;
  language: string;
  requiresConfirmation: boolean;
  confirmationPayload?: BookingConfirmationPayload | null;
  bookingResult?: {
    id: string;
    token: string;
    status: string;
    crop: string;
    quantityKg: number;
    mandiName: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  intent: AgentIntent;
  error?: string | null;
}
