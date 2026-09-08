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
6. Speak warmly and naturally in the farmer's selected language. If the user's selected language is English ('en') or the prompt is written in English, respond in clear English. If language is Hindi ('hi') or Marathi ('mr'), respond in that language.
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

export const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "searchMandis",
      description: "Search APMC mandis by name, owner name, district, or crop in PostgreSQL",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for mandi name or location" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMandiDetails",
      description: "Get detailed info for an APMC mandi by mandiId",
      parameters: {
        type: "object",
        properties: {
          mandiId: { type: "string", description: "The Mandi Profile ID" },
        },
        required: ["mandiId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAvailableSlots",
      description: "Get active time slots for a mandi on a specific date (YYYY-MM-DD)",
      parameters: {
        type: "object",
        properties: {
          mandiId: { type: "string", description: "The Mandi Profile ID" },
          date: { type: "string", description: "ISO Date YYYY-MM-DD" },
        },
        required: ["mandiId", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkSlotCapacity",
      description: "Check if slot has sufficient capacity for requested KG quantity",
      parameters: {
        type: "object",
        properties: {
          slotId: { type: "string", description: "Slot ID" },
          quantityKg: { type: "number", description: "Quantity in KG" },
        },
        required: ["slotId", "quantityKg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCropRate",
      description: "Get market benchmark rate per KG for a crop",
      parameters: {
        type: "object",
        properties: {
          crop: { type: "string", description: "Crop name" },
        },
        required: ["crop"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyBookings",
      description: "Fetch active and past bookings for the authenticated farmer",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Authenticated farmer user ID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelBooking",
      description: "Cancel a pending booking request",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "Booking ID" },
        },
        required: ["bookingId"],
      },
    },
  },
];

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

  // 2. Invoke Real Groq API LLM with Tool Calling Schema
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ];

    const aiRes = await chatCompletion(messages, GROQ_TOOLS);

    // If Groq requested tool calls, execute them against Prisma/PostgreSQL
    if (aiRes.toolCalls && aiRes.toolCalls.length > 0) {
      for (const tc of aiRes.toolCalls) {
        if (tc.name === "searchMandis") {
          const res = await toolSearchMandis({ query: tc.arguments?.query || userText });
          if (res.length > 0 && res[0]) {
            state.mandiId = res[0].id;
            state.mandiInfo = res[0];
          }
        } else if (tc.name === "getAvailableSlots") {
          const res = await toolGetAvailableSlots({ mandiId: tc.arguments?.mandiId || state.mandiId || "", date: tc.arguments?.date || resolveTargetDate(userText) });
          if (res.length > 0 && res[0]) {
            state.slotId = res[0].slotId;
            state.slotInfo = res[0];
          }
        } else if (tc.name === "checkSlotCapacity") {
          await toolCheckSlotCapacity({ slotId: tc.arguments?.slotId || state.slotId || "", quantityKg: tc.arguments?.quantityKg || 100 });
        } else if (tc.name === "getCropRate") {
          await toolGetCropRate({ crop: tc.arguments?.crop || "Wheat" });
        } else if (tc.name === "getMyBookings") {
          const res = await toolGetMyBookings(state.userId);
          return {
            ...state,
            intent: "VIEW_BOOKINGS",
            responseText: res.length > 0
              ? `आपके पास ${res.length} एक्टिव बुकिंग्स हैं:\n` + res.map(b => `• ${b.crop} (${b.quantityKg} KG) - ${b.status}`).join("\n")
              : "आपके पास वर्तमान में कोई एक्टिव बुकिंग नहीं है।",
          };
        } else if (tc.name === "cancelBooking") {
          const res = await toolCancelBooking({ userId: state.userId, bookingId: tc.arguments?.bookingId });
          return {
            ...state,
            intent: "CANCEL_BOOKING",
            responseText: `बुकिंग (ID: ${res.bookingId}) की स्थिति: ${res.status}।`,
          };
        }
      }
    }

    if (aiRes.content && !userText.toLowerCase().includes("book") && !userText.toLowerCase().includes("बुक")) {
      return {
        ...state,
        responseText: aiRes.content,
      };
    }
  } catch (err: any) {
    console.warn("Groq LLM call error in runBookingAgent, continuing with database resolution:", err?.message);
  }

  // 3. Perform Mandi resolution & Slot Check
  const targetDate = state.date || resolveTargetDate(userText);
  const parsedKg = parseQuantityKg(userText) || (state.crops?.[0]?.quantityKg ?? 100);
  const cropNorm = normalizeCropName(userText);

  let mandis: AgentMandiInfo[] = state.mandiMatches || [];
  if (!state.mandiId) {
    mandis = await toolSearchMandis({ query: state.mandiQuery || userText || "Rupesh" });
  }

  if (mandis.length === 0 && !state.mandiId) {
    return {
      ...state,
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

  if (!availableSlots || availableSlots.length === 0 || !availableSlots[0]) {
    return {
      ...state,
      mandiId,
      mandiInfo: selectedMandi,
      date: targetDate,
      responseText: `${selectedMandi.name} में ${targetDate} के लिए कोई एक्टिव स्लॉट उपलब्ध नहीं है। कृपया कोई अन्य तारीख चुनें।`,
    };
  }

  const selectedSlot = availableSlots[0];

  // 5. Capacity & Rate Validation
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

  let responseText = `${selectedMandi.name} में ${selectedSlot.date} को सुबह ${selectedSlot.startTime} – ${selectedSlot.endTime} का स्लॉट उपलब्ध है।
फसल: ${cropNorm.name} (${parsedKg} KG)
अनुमानित मूल्य: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)

क्या मैं यह booking request सबमिट कर दूँ? (हाँ / Confirm कहें)`;

  if (state.language === "en") {
    responseText = `Slot available at ${selectedMandi.name} on ${selectedSlot.date} (${selectedSlot.startTime} – ${selectedSlot.endTime}).
Crop: ${cropNorm.name} (${parsedKg} KG)
Estimated Payout: ₹${estimatedPayout.toLocaleString("en-IN")} (Rate: ₹${rateInfo.ratePerKg}/KG)

Would you like me to submit this booking request? (Say Yes or tap Confirm)`;
  } else if (state.language === "mr") {
    responseText = `${selectedMandi.name} मध्ये ${selectedSlot.date} रोजी सकाळी ${selectedSlot.startTime} – ${selectedSlot.endTime} चा स्लॉट उपलब्ध आहे.
पीक: ${cropNorm.name} (${parsedKg} KG)
अंदाजे उत्पन्न: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)

मी ही बुकिंग विनंती सबमिट करू का? (होय / Confirm म्हणा)`;
  }

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
