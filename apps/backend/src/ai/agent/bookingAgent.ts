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
 * Extracts mandi name / location keywords from user prompt text.
 */
export function extractMandiQuery(text: string): string {
  let cleaned = (text || "").toLowerCase();
  cleaned = cleaned
    .replace(/\b(book|booking|slot|slots|wheat|gehu|gehun|rice|mustard|cotton|soyabean|maize|chana|kg|kilo|kilogram|quintal|tomorrow|today|parso|udya|kal|in|at|for|the|me|a|an|please|can|you|show|available|list|my|mandi|mandis|apmc|yard|bazaar|market)\b/gi, " ")
    .replace(/\b\d+(:\d+)?\s*(am|pm)?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
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

        const lang = state.language || "en";
        let resp = `Your booking request has been successfully submitted! Booking Token: ${result.token}. Status: PENDING (awaiting mandi operator approval).`;
        if (lang === "hi") {
          resp = `आपकी बुकिंग रिक्वेस्ट सफलतापूर्वक दर्ज कर ली गई है! टोकन: ${result.token}। स्थिति: PENDING (मंडी ऑपरेटर द्वारा स्वीकार का इंतज़ार)।`;
        } else if (lang === "mr") {
          resp = `आपली बुकिंग विनंती यशस्वीरित्या सबमिट केली आहे! टोकन: ${result.token}. स्थिती: PENDING.`;
        }

        return {
          ...state,
          bookingId: result.id,
          bookingToken: result.token,
          bookingStatus: result.status,
          confirmationRequired: false,
          confirmed: true,
          responseText: resp,
        };
      } catch (err: any) {
        return {
          ...state,
          confirmationRequired: false,
          error: err.message || "Booking creation failed.",
          responseText: `Failed to create booking: ${err.message || "Please try again later."}`,
        };
      }
    }
  }

  // 2. If user asks about their existing bookings
  if (
    lower.includes("my booking") ||
    lower.includes("मेरी बुकिंग") ||
    lower.includes("माझी बुकिंग") ||
    lower.includes("list booking")
  ) {
    const dbBookings = await toolGetMyBookings(state.userId);
    const lang = state.language || "en";
    let resp = dbBookings.length > 0
      ? `You have ${dbBookings.length} active booking(s) in PostgreSQL database:\n` + dbBookings.map(b => `• ${b.mandiName} - ${b.crop} (${b.quantityKg} KG) on ${b.date} [Status: ${b.status}]`).join("\n")
      : "You currently have no active slot bookings in the database.";

    if (lang === "hi") {
      resp = dbBookings.length > 0
        ? `आपके पास डेटाबेस में ${dbBookings.length} एक्टिव बुकिंग्स हैं:\n` + dbBookings.map(b => `• ${b.mandiName} - ${b.crop} (${b.quantityKg} KG) तारीख ${b.date} [स्थिति: ${b.status}]`).join("\n")
        : "आपके पास वर्तमान में कोई एक्टिव बुकिंग नहीं है।";
    } else if (lang === "mr") {
      resp = dbBookings.length > 0
        ? `आपल्याकडे डेटाबेसमध्ये ${dbBookings.length} बुकिंग्स आहेत:\n` + dbBookings.map(b => `• ${b.mandiName} - ${b.crop} (${b.quantityKg} KG) तारीख ${b.date} [स्थिती: ${b.status}]`).join("\n")
        : "आपल्याकडे सध्या कोणतीही बुकिंग नाही.";
    }

    return {
      ...state,
      intent: "VIEW_BOOKINGS",
      responseText: resp,
    };
  }

  // 3. Perform Real Database Resolutions from PostgreSQL
  const targetDate = state.date || resolveTargetDate(userText);
  const parsedKg = parseQuantityKg(userText) || (state.crops?.[0]?.quantityKg ?? 100);
  const cropNorm = normalizeCropName(userText);

  // Search mandis in PostgreSQL
  const extractedQuery = state.mandiQuery || extractMandiQuery(userText);
  let mandis: AgentMandiInfo[] = state.mandiMatches || [];
  if (!state.mandiId) {
    mandis = await toolSearchMandis({ query: extractedQuery });
  }

  if (mandis.length === 0 && !state.mandiId) {
    const lang = state.language || "en";
    return {
      ...state,
      responseText: lang === "hi"
        ? "मुझे डेटाबेस में कोई मंडी नहीं मिली। कृपया मंडी का नाम बताएँ (जैसे 'Rupesh Mandi')।"
        : lang === "mr"
        ? "मला डेटाबेसमध्ये कोणतीही मंडी सापडली नाही. कृपया मंडीचे नाव सांगा."
        : "No APMC mandi matching your request was found in the database. Please specify a valid mandi name.",
    };
  }

  const selectedMandi = state.mandiInfo || mandis[0];
  const mandiId = state.mandiId || selectedMandi?.id;

  if (!selectedMandi || !mandiId) {
    return {
      ...state,
      mandiMatches: mandis,
      responseText: `Found ${mandis.length} mandis in database. Please specify which mandi you want to select: ` + mandis.map(m => m.name).join(", "),
    };
  }

  // Fetch real available slots from PostgreSQL DB
  const availableSlots = await toolGetAvailableSlots({ mandiId, date: targetDate });

  if (!availableSlots || availableSlots.length === 0 || !availableSlots[0]) {
    const lang = state.language || "en";
    return {
      ...state,
      mandiId,
      mandiInfo: selectedMandi,
      date: targetDate,
      responseText: lang === "hi"
        ? `${selectedMandi.name} में ${targetDate} के लिए कोई एक्टिव स्लॉट उपलब्ध नहीं है।`
        : lang === "mr"
        ? `${selectedMandi.name} मध्ये ${targetDate} साठी कोणतीही वेळ उपलब्ध नाही.`
        : `${selectedMandi.name} has no active arrival slots available on ${targetDate}. Please select another date.`,
    };
  }

  const selectedSlot = availableSlots[0];

  // Validate slot capacity against PostgreSQL DB
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
      responseText: capacityCheck.reason || "This slot does not have sufficient remaining capacity.",
    };
  }

  // Fetch benchmark price rate from PostgreSQL DB
  const rateInfo = await toolGetCropRate({ crop: cropNorm.name });
  const estimatedPayout = Math.round(parsedKg * rateInfo.ratePerKg);

  // Invoke Groq LLM grounded with real PostgreSQL data
  try {
    const promptWithContext = `User Prompt: "${userText}"
Ground Truth from PostgreSQL DB:
- Mandi Name: ${selectedMandi.name}
- Slot Date: ${selectedSlot.date} (${selectedSlot.startTime} to ${selectedSlot.endTime})
- Crop: ${cropNorm.name}
- Requested Quantity: ${parsedKg} KG
- Rate per KG: ₹${rateInfo.ratePerKg}
- Total Payout: ₹${estimatedPayout}
- Requested Language: ${state.language || "en"}

Generate a warm, polite response strictly in language "${state.language || "en"}". Include details: Mandi name, Date, Slot time, Crop name, Quantity in KG, Estimated payout amount (₹), and ask if they would like to submit/confirm the booking request.`;

    const aiRes = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: promptWithContext },
    ]);

    if (aiRes.content && aiRes.content.trim()) {
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
        responseText: aiRes.content,
      };
    }
  } catch (err: any) {
    console.warn("Groq LLM call error, falling back to database formatter:", err?.message);
  }

  // Fallback DB Formatted Response if Groq fails or API key unavailable
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

  const lang = state.language || "en";
  let responseText = `Slot available at ${selectedMandi.name} on ${selectedSlot.date} (${selectedSlot.startTime} – ${selectedSlot.endTime}).\nCrop: ${cropNorm.name} (${parsedKg} KG)\nEstimated Payout: ₹${estimatedPayout.toLocaleString("en-IN")} (Rate: ₹${rateInfo.ratePerKg}/KG)\n\nWould you like me to submit this booking request? (Say Yes or tap Confirm)`;

  if (lang === "hi") {
    responseText = `${selectedMandi.name} में ${selectedSlot.date} को सुबह ${selectedSlot.startTime} – ${selectedSlot.endTime} का स्लॉट उपलब्ध है।\nफसल: ${cropNorm.name} (${parsedKg} KG)\nअनुमानित मूल्य: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)\n\nक्या मैं यह booking request सबमिट कर दूँ? (हाँ / Confirm कहें)`;
  } else if (lang === "mr") {
    responseText = `${selectedMandi.name} मध्ये ${selectedSlot.date} रोजी सकाळी ${selectedSlot.startTime} – ${selectedSlot.endTime} चा स्लॉट उपलब्ध आहे.\nपीक: ${cropNorm.name} (${parsedKg} KG)\nअंदाजे उत्पन्न: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)\n\nमी ही बुकिंग विनंती सबमिट करू का? (होय / Confirm म्हणा)`;
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

