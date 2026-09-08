# Real Groq AI Voice & Chat Booking Agent — Mandi Setu

## Overview
The Mandi Setu AI Voice Booking Agent is a production-connected, multilingual voice and text assistant that enables farmers to query APMC mandi details, check real-time arrival slots, verify slot capacity, calculate pricing in **KG**, and submit official slot booking requests.

---

## Architecture

```
Farmer Setu App (React Native / Web)
        │
        ├─ Audio Recording (MediaRecorder API) / Text Prompt
        ▼
Express Backend (`/api/v1/ai/voice` & `/api/v1/ai/message`)
        │
        ├─ Authenticated User Context (req.user.id)
        ▼
Groq Provider (`groq-sdk`)
        ├─ Audio Transcription: `whisper-large-v3-turbo`
        └─ Natural Language & Function Calling: `qwen/qwen3.8-27b`
        │
        ▼
AI Tools Layer (`aiTools.ts`)
        ├─ searchMandis
        ├─ getMandiDetails
        ├─ getAvailableSlots
        ├─ checkSlotCapacity
        ├─ getCropRate
        ├─ getMyBookings
        └─ createBookingRequest
        │
        ▼
Prisma ORM & PostgreSQL (`sih_db`)
```

---

## API Reference

### 1. Send Text Message
* **Endpoint**: `POST /api/v1/ai/message`
* **Headers**: `Authorization: Bearer <farmer_access_token>`
* **Body**:
```json
{
  "message": "रुपेश की मंडी में कल 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो",
  "conversationId": "conv_12345"
}
```
* **Response**:
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_12345",
    "responseText": "Rupesh's APMC Mandi में 2026-09-09 को सुबह 07:00 – 11:00 का स्लॉट उपलब्ध है...",
    "confirmationRequired": true,
    "confirmationPayload": {
      "mandiId": "mandi_xyz",
      "mandiName": "Rupesh's APMC Mandi",
      "slotId": "slot_abc",
      "date": "2026-09-09",
      "startTime": "07:00",
      "endTime": "11:00",
      "crop": "Wheat",
      "quantityKg": 100,
      "ratePerKg": 24.5,
      "estimatedPayout": 2450
    }
  }
}
```

### 2. Send Voice Recording
* **Endpoint**: `POST /api/v1/ai/voice`
* **Headers**: `Authorization: Bearer <farmer_access_token>`
* **Form-Data**:
  - `audio`: Audio file blob (`audio/webm`, `audio/mp4`, `audio/wav`)
  - `conversationId`: Optional conversation ID
* **Response**: Includes `transcript` field along with the standard AI response.

---

## Business & Safety Safeguards
1. **Weight Standard**: All crop weights, capacities, and rates are calculated and rendered strictly in **KG (Kilograms)**.
2. **Pending Booking Policy**: Initial AI booking submission creates a `PENDING` request. Gate tokens and QR passes are **never** generated during initial creation — they are generated only after Mandi Operator approval.
3. **Capacity Re-Validation**: Slot capacity is re-validated within a database transaction before final insertion.
4. **Idempotency Key**: Prevents duplicate bookings from repeated network calls or tool invocations.

---

## Environment Variables (`apps/backend/.env`)
```env
GROQ_API_KEY="gsk_..."
GROQ_MODEL="qwen/qwen3.8-27b"
GROQ_TRANSCRIPTION_MODEL="whisper-large-v3-turbo"
```
