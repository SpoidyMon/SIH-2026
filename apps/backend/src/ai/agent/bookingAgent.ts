import {
  BookingAgentState,
  AgentIntent,
  BookingConfirmationPayload,
  AgentMandiInfo,
  AgentSlotInfo,
} from "../../interfaces/index.js";
import {
  toolSearchMandis,
  toolGetMandiDetails,
  toolGetAvailableSlots,
  toolSearchCrops,
  toolCheckSlotCapacity,
  toolGetCropRate,
  toolCreateBookingRequest,
  toolGetMyBookings,
  toolCancelBooking,
  normalizeCropName,
} from "../tools/aiTools.js";
import { chatCompletion } from "../provider/groq.provider.js";

/**
 * System prompt defining the strict operational boundaries and tone for Mandi Setu AI.
 */
export const SYSTEM_PROMPT = `
You are Mandi Setu AI, an expert, polite, and efficient multilingual agricultural mandi slot booking voice assistant.

Your primary mission is to help authenticated farmers discover certified APMC mandis, query arrival time-slots, check real-time crop rates, and submit official booking requests.

STRICT OPERATIONAL RULES:
1. NEVER invent or fabricate mandi names, slot times, capacities, prices, booking IDs, gate tokens, or QR codes.
2. All crop quantities and slot weights MUST be calculated, processed, and displayed strictly in KG (Kilograms). (1 Quintal = 100 KG).
3. Every booking request created remains PENDING until a Mandi Operator accepts it. Do NOT claim a gate token or QR pass has been issued while status is PENDING.
4. You MUST show an explicit confirmation summary before submitting a booking request.
5. Derive farmer user ID strictly from the authenticated backend server context. Never accept a user ID from prompts.
6. Speak warmly and naturally in the farmer's language (Hindi, Marathi, Gujarati, Punjabi, Hinglish, English).
7. Keep responses concise, clear, and easy to understand over voice audio.
`;

/**
 * Resolves relative natural language dates (e.g. "tomorrow", "कल", "उद्या") to YYYY-MM-DD.
 */
export function resolveTargetDate(text: string): string {
  const lower = (text || "").toLowerCase();
  const now = new Date();

  if (/parso|parwa|परसों|परवा|day after tomorrow/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  if (/kal|udya|कल|उद्या|tomorrow/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  // Default to today or tomorrow depending on current time
  if (now.getHours() >= 18) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  return now.toISOString().slice(0, 10);
}

/**
 * Parses numeric KG quantity from natural language text (e.g. "100 kilo", "१०० किलो", "1 quintal").
 */
export function parseQuantityKg(text: string): number | null {
  const str = (text || "")
    .replace(/[०-९]/g, (d) => "०१२३४५६७८९".indexOf(d).toString())
    .toLowerCase();

  // Check quintal conversion
  const quintalMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:quintal|क्विंटल|कुंतल)/i);
  if (quintalMatch && quintalMatch[1]) {
    return Math.round(parseFloat(quintalMatch[1]) * 100);
  }

  // Check direct KG
  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|किलो|किग्रा|kgms)/i);
  if (kgMatch && kgMatch[1]) {
    return Math.round(parseFloat(kgMatch[1]));
  }

  // Plain number match if "book" or crop is present
  const numberMatch = str.match(/(\d+)/);
  if (numberMatch && numberMatch[1] && (str.includes("book") || str.includes("स्लॉट") || str.includes("गेहूं") || str.includes("गहू"))) {
    const val = parseInt(numberMatch[1], 10);
    if (val > 0 && val < 50000) return val;
  }

  return null;
}

/**
 * Detects user intent from prompt.
 */
export function detectIntent(text: string): AgentIntent {
  const lower = (text || "").toLowerCase();

  if (lower.includes("cancel") || lower.includes("रद्द")) {
    return "CANCEL_BOOKING";
  }
  if (lower.includes("my booking") || lower.includes("मेरी बुकिंग") || lower.includes("माझी बुकिंग")) {
    return "VIEW_BOOKINGS";
  }
  if (lower.includes("book") || lower.includes("बुक") || lower.includes("slot")) {
    return "BOOK_SLOT";
  }
  if (lower.includes("mandi") || lower.includes("मंडी")) {
    return "SEARCH_MANDI";
  }

  return "BOOK_SLOT";
}

/**
 * Main state machine runner processing conversation step and tool execution.
 */
export async function runBookingAgent(state: BookingAgentState): Promise<BookingAgentState> {
  const userText = state.userMessage.trim();
  const lower = userText.toLowerCase();

  // 1. If explicit confirmation was sent by user
  if (
    state.confirmed ||
    lower === "yes" ||
    lower === "confirm" ||
    lower.includes("हाँ") ||
    lower.includes("होय") ||
    lower.includes("बुक कर दो")
  ) {
    if (state.confirmationPayload && state.confirmationPayload.slotId) {
      try {
        const result = await toolCreateBookingRequest({
          userId: state.userId,
          mandiProfileId: state.confirmationPayload.mandiId,
          slotId: state.confirmationPayload.slotId,
          crop: state.confirmationPayload.crop,
          quantityKg: state.confirmationPayload.quantityKg,
        });

        return {
          ...state,
          bookingId: result.id,
          bookingToken: result.token,
          bookingStatus: result.status,
          confirmationRequired: false,
          confirmed: true,
          responseText: `आपकी booking request सफलतापूर्वक दर्ज कर ली गई है! Booking ID: ${result.token}। मंडी operator के स्वीकार करने के बाद आपका Gate Token जारी किया जाएगा।`,
        };
      } catch (err: any) {
        return {
          ...state,
          confirmationRequired: false,
          error: err.message || "Booking creation failed.",
          responseText: `माफ़ कीजिए, बुकिंग दर्ज नहीं हो पाई: ${err.message || "कृपया थोड़ी देर बाद फिर कोशिश करें।"}`,
        };
      }
    }
  }

  // 2. Extract entities from user prompt
  const intent = state.intent || detectIntent(userText);
  const targetDate = state.date || resolveTargetDate(userText);
  const parsedKg = parseQuantityKg(userText) || (state.crops?.[0]?.quantityKg ?? 100);
  const cropNorm = normalizeCropName(userText);

  // 3. Perform Mandi resolution
  let mandis: AgentMandiInfo[] = state.mandiMatches || [];
  if (!state.mandiId) {
    mandis = await toolSearchMandis({ query: state.mandiQuery || userText || "Rupesh" });
  }

  if (mandis.length === 0 && !state.mandiId) {
    return {
      ...state,
      intent,
      responseText: "मुझे कोई मंडी नहीं मिली। कृपया मंडी का नाम बताएँ (जैसे 'Rupesh Mandi')।",
    };
  }

  const selectedMandi = state.mandiInfo || mandis[0];
  const mandiId = state.mandiId || selectedMandi?.id;

  if (!selectedMandi || !mandiId) {
    return {
      ...state,
      mandiMatches: mandis,
      responseText: mandis.length > 0
        ? `मुझे ${mandis.length} मंडियां मिली हैं। आप कौनसी मंडी में बुक करना चाहते हैं?`
        : "मुझे कोई मंडी नहीं मिली। कृपया मंडी का नाम बताएँ (जैसे 'Rupesh Mandi')।",
    };
  }

  // 4. Fetch available slots
  const availableSlots = await toolGetAvailableSlots({ mandiId, date: targetDate });

  if (!availableSlots || availableSlots.length === 0) {
    return {
      ...state,
      mandiId,
      mandiInfo: selectedMandi,
      date: targetDate,
      responseText: `${selectedMandi.name} में ${targetDate} के लिए कोई एक्टिव स्लॉट उपलब्ध नहीं है। कृपया कोई अन्य तारीख चुनें।`,
    };
  }

  // Find requested slot time or default to first open slot
  const selectedSlot = availableSlots[0];
  if (!selectedSlot) {
    return {
      ...state,
      mandiId,
      mandiInfo: selectedMandi,
      date: targetDate,
      responseText: `${selectedMandi.name} में ${targetDate} के लिए कोई एक्टिव स्लॉट उपलब्ध नहीं है।`,
    };
  }

  // 5. Server-side Capacity & Rate Validation
  const capacityCheck = await toolCheckSlotCapacity({
    slotId: selectedSlot.slotId,
    quantityKg: parsedKg,
  });

  if (!capacityCheck.valid) {
    return {
      ...state,
      mandiId,
      mandiInfo: selectedMandi,
      slotId: selectedSlot.slotId,
      responseText: `क्षमा करें! ${capacityCheck.reason || "इस स्लॉट में पर्याप्त capacity उपलब्ध नहीं है।"}`,
    };
  }

  const rateInfo = await toolGetCropRate({ crop: cropNorm.name });
  const estimatedPayout = Math.round(parsedKg * rateInfo.ratePerKg);

  // 6. Build Confirmation Payload
  const confirmationPayload: BookingConfirmationPayload = {
    mandiId,
    mandiName: selectedMandi.name,
    slotId: selectedSlot.slotId,
    date: selectedSlot.date,
    startTime: selectedSlot.startTime,
    endTime: selectedSlot.endTime,
    crop: cropNorm.name,
    quantityKg: parsedKg,
    ratePerKg: rateInfo.ratePerKg,
    estimatedPayout,
    remainingCapacity: selectedSlot.availableBookings,
    idempotencyKey: `IDEM-${state.conversationId}-${Date.now().toString().slice(-6)}`,
  };

  const responseText = `${selectedMandi.name} में ${selectedSlot.date} को सुबह ${selectedSlot.startTime} – ${selectedSlot.endTime} का स्लॉट उपलब्ध है।
फसल: ${cropNorm.name} (${parsedKg} KG)
अनुमानित मूल्य: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)

क्या मैं यह booking request सबमिट कर दूँ? (हाँ / Confirm कहें)`;

  return {
    ...state,
    intent: "BOOK_SLOT",
    mandiId,
    mandiInfo: selectedMandi,
    date: selectedSlot.date,
    slotId: selectedSlot.slotId,
    slotInfo: selectedSlot,
    crops: [{ cropId: cropNorm.cropId, name: cropNorm.name, quantityKg: parsedKg, ratePerKg: rateInfo.ratePerKg, estimatedAmount: estimatedPayout }],
    confirmationRequired: true,
    confirmationPayload,
    responseText,
  };
}
