import { requestApi, API_BASE_URL } from './api';
import { getStorageItem, AUTH_TOKEN_KEY } from '@/utils/storage';

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
  remainingCapacity: number;
  idempotencyKey: string;
}

export interface AgentResponsePayload {
  conversationId: string;
  transcript?: string;
  responseText: string;
  language: string;
  requiresConfirmation: boolean;
  confirmationRequired?: boolean;
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
  intent: string;
  error?: string | null;
}

/**
 * Sends text prompt to AI assistant endpoint.
 */
export async function sendTextMessageApi(
  token: string,
  message: string,
  conversationId?: string,
  language?: string
) {
  return requestApi<AgentResponsePayload>('/ai/message', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId, language }),
  });
}

export async function sendAiTextMessage(params: {
  conversationId?: string;
  message: string;
  language?: string;
  confirmed?: boolean;
  idempotencyKey?: string;
}) {
  return requestApi<AgentResponsePayload>('/ai/message', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Sends audio recording blob/URI to AI voice endpoint.
 */
export async function sendVoiceAudioApi(
  token: string,
  audioBlob: Blob | File,
  conversationId?: string,
  languageHint?: string
) {
  const formData = new FormData();

  formData.append('audio', audioBlob, 'farmer_voice.webm');
  if (conversationId) formData.append('conversationId', conversationId);
  if (languageHint) formData.append('languageHint', languageHint);

  const url = `${API_BASE_URL}/ai/voice`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const resData = await response.json();
  if (!response.ok) {
    return {
      success: false,
      message: resData.message || 'Voice processing failed',
      code: resData.code || 'VOICE_ERROR',
    };
  }

  return resData;
}

export async function sendAiVoiceMessage(params: {
  audioBlob: Blob | File;
  conversationId?: string;
  languageHint?: string;
  confirmed?: boolean;
  idempotencyKey?: string;
}) {
  return sendVoiceAudioApi('', params.audioBlob, params.conversationId, params.languageHint);
}
