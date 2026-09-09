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
4. Only show a booking confirmation summary when the user explicitly requests to book a slot or submit a booking.
5. For greetings or questions asking to search or list mandis, respond directly to the question and list the matching mandis from the database. Do NOT generate a booking request card for greetings or general mandi list searches.
6. Derive farmer user ID strictly from the authenticated backend server context.
7. Speak warmly and naturally in the farmer's selected language (English 'en', Hindi 'hi', Marathi 'mr').
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

  const quintalMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:quintal|क्विंटल|कुंतल)/i);
  if (quintalMatch && quintalMatch[1]) {
    return Math.round(parseFloat(quintalMatch[1]) * 100);
  }

  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|किलो|किग्रा|kgms)/i);
  if (kgMatch && kgMatch[1]) {
    return Math.round(parseFloat(kgMatch[1]));
  }

  const numberMatch = str.match(/(\d+)/);
  if (numberMatch && numberMatch[1] && (str.includes("book") || str.includes("स्लॉट") || str.includes("गेहूं") || str.includes("गहू"))) {
    const val = parseInt(numberMatch[1], 10);
    if (val > 0 && val < 50000) return val;
  }

  return null;
}

/**
 * Extracts mandi name / location keywords from user prompt text.
 */
export function extractMandiQuery(text: string): string {
  let cleaned = (text || "").toLowerCase();
  cleaned = cleaned
    .replace(/\b(book|booking|slot|slots|wheat|gehu|gehun|rice|mustard|cotton|soyabean|maize|chana|kg|kilo|kilogram|quintal|tomorrow|today|parso|udya|kal|in|at|for|the|me|a|an|please|can|you|show|available|list|my|mandi|mandis|apmc|yard|bazaar|market|give|oist|of|them|there|any|more|is|are)\b/gi, " ")
    .replace(/\b\d+(:\d+)?\s*(am|pm)?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
}

/**
 * Detects user intent from prompt text.
 */
export function detectIntent(text: string): AgentIntent {
  const lower = (text || "").toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|namaste|greetings|नमस्ते|नमस्कार|हॅलो)\b/i.test(lower) && lower.length < 15) {
    return "GREETING";
  }

  // 2. Cancellation
  if (lower.includes("cancel") || lower.includes("रद्द")) {
    return "CANCEL_BOOKING";
  }

  // 3. User's existing bookings
  if (
    lower.includes("my booking") ||
    lower.includes("meri booking") ||
    lower.includes("majhi booking") ||
    lower.includes("मेरी बुकिंग") ||
    lower.includes("माझी बुकिंग") ||
    lower.includes("list booking") ||
    lower.includes("my slots")
  ) {
    return "VIEW_BOOKINGS";
  }

  // 4. Crop rate query
  if (
    (lower.includes("rate") || lower.includes("price") || lower.includes("भाव") || lower.includes("दर") || lower.includes("मूल्य")) &&
    !lower.includes("book")
  ) {
    return "GET_CROP_RATE";
  }

  // 5. Search or list mandis
  if (
    lower.includes("list") ||
    lower.includes("oist") ||
    lower.includes("all mandis") ||
    lower.includes("more mandis") ||
    lower.includes("other mandis") ||
    lower.includes("search mandi") ||
    lower.includes("find mandi") ||
    lower.includes("मंडियां") ||
    lower.includes("मंड्या") ||
    (lower.includes("mandi") && !lower.includes("book") && !lower.includes("slot"))
  ) {
    return "SEARCH_MANDI";
  }

  // 6. Explicit booking intent
  if (lower.includes("book") || lower.includes("बुक") || lower.includes("slot") || lower.includes("स्लॉट")) {
    return "BOOK_SLOT";
  }

  // Default heuristic
  if (/\d+/.test(lower) || /gehu|wheat|rice|mustard|cotton|soyabean/i.test(lower)) {
    return "BOOK_SLOT";
  }

  return "SEARCH_MANDI";
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
];

/**
 * Main state machine runner processing conversation step and tool execution.
 */
export async function runBookingAgent(state: BookingAgentState): Promise<BookingAgentState> {
  const userText = state.userMessage.trim();
  const lower = userText.toLowerCase();
  const intent = detectIntent(userText);
  const lang = state.language || "en";

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

  // 2. Greeting Intent
  if (intent === "GREETING") {
    let resp = "Hello! Welcome to Mandi Setu AI Assistant. I am connected live to your PostgreSQL database. I can help you search APMC mandis, check crop benchmark rates (per KG), view slot availability, or book arrival slots. How can I assist you today?";
    if (lang === "hi") {
      resp = "नमस्ते! मण्डी सेतु AI सहायक में आपका स्वागत है। मैं आपके लाइव डेटाबेस से जुड़ा हुआ हूँ। आप मुझसे मंडी खोज सकते हैं, फसल दर (प्रति KG) पूछ सकते हैं या स्लॉट बुक कर सकते हैं। आज मैं आपकी क्या मदद कर सकता हूँ?";
    } else if (lang === "mr") {
      resp = "नमस्ते! मण्डी सेतू AI सहाय्यकामध्ये आपले स्वागत आहे. मी आपल्या लाइव्ह डेटाबेसशी जोडलेला आहे. तुम्ही मंडी शोधू शकता, पीक दर (प्रति KG) विचारू शकता किंवा स्लॉट बुक करू शकता. आज मी तुम्हाला कशी मदत करू शकेन?";
    }
    return {
      ...state,
      intent: "GREETING",
      confirmationRequired: false,
      responseText: resp,
    };
  }

  // 3. View Existing Bookings Intent
  if (intent === "VIEW_BOOKINGS") {
    const dbBookings = await toolGetMyBookings(state.userId);
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
      confirmationRequired: false,
      responseText: resp,
    };
  }

  // 4. Crop Rate Query Intent
  if (intent === "GET_CROP_RATE") {
    const cropNorm = normalizeCropName(userText);
    const rateInfo = await toolGetCropRate({ crop: cropNorm.name });

    let resp = `The current market benchmark rate for **${cropNorm.name}** is **₹${rateInfo.ratePerKg} per KG** (₹${rateInfo.ratePerKg * 100} per Quintal).`;
    if (lang === "hi") {
      resp = `**${cropNorm.name}** का वर्तमान बाजार दर **₹${rateInfo.ratePerKg} प्रति KG** (₹${rateInfo.ratePerKg * 100} प्रति क्विंटल) है।`;
    } else if (lang === "mr") {
      resp = `**${cropNorm.name}** चा सध्याचा बाजार भाव **₹${rateInfo.ratePerKg} प्रति KG** (₹${rateInfo.ratePerKg * 100} प्रति क्विंटल) आहे.`;
    }

    return {
      ...state,
      intent: "GET_CROP_RATE",
      confirmationRequired: false,
      responseText: resp,
    };
  }

  // 5. Search / List Mandis Intent
  if (intent === "SEARCH_MANDI") {
    const extractedQuery = state.mandiQuery || extractMandiQuery(userText);
    const mandis = await toolSearchMandis({ query: extractedQuery });

    let resp = "";
    if (mandis.length === 0) {
      resp = lang === "hi"
        ? "मुझे आपके अनुरोध के अनुसार डेटाबेस में कोई मंडी नहीं मिली।"
        : lang === "mr"
        ? "मला आपल्या विनंतीनुसार डेटाबेसमध्ये कोणतीही मंडी सापडली नाही."
        : "No APMC mandis matching your location/name request were found in the database.";
    } else {
      try {
        const prompt = `User asked: "${userText}"
Matching Mandis found in PostgreSQL Database (${mandis.length} mandis):
${mandis.map((m, i) => `${i + 1}. Name: ${m.name}, Location: ${m.district || m.state || m.address}, Rating: ${m.rating}`).join("\n")}

Respond to the user politely in language "${lang}". List all the mandis found nicely with bullet points. Ask which mandi they would like to select or book a slot for. Do NOT output a booking request confirmation card.`;

        const aiRes = await chatCompletion([
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ]);

        if (aiRes.content && aiRes.content.trim()) {
          resp = aiRes.content;
        }
      } catch (err: any) {
        console.warn("Groq LLM search response error:", err?.message);
      }

      if (!resp) {
        resp = `Here are the APMC mandis found in the database matching your request:\n\n` +
          mandis.map((m, i) => `${i + 1}. **${m.name}**\n   • Location: ${m.district || m.state || m.address || "APMC Yard"}\n   • Rating: ⭐ ${m.rating}`).join("\n\n") +
          `\n\nWhich mandi would you like to select for booking?`;
      }
    }

    return {
      ...state,
      intent: "SEARCH_MANDI",
      mandiMatches: mandis,
      confirmationRequired: false,
      responseText: resp,
    };
  }

  // Extract combined text from history for multi-turn fallback
  const conversationHistoryText = (state.historyMessages || []).map((m) => m.content).join(" ");
  const combinedText = `${userText} ${conversationHistoryText}`;

  // 6. Explicit Booking Intent (BOOK_SLOT)
  const targetDate = state.date || resolveTargetDate(userText) || resolveTargetDate(conversationHistoryText);
  const parsedKg = parseQuantityKg(userText) || parseQuantityKg(conversationHistoryText) || (state.crops?.[0]?.quantityKg ?? 100);
  const cropNorm = normalizeCropName(userText) || normalizeCropName(conversationHistoryText);
  const extractedQuery = state.mandiQuery || extractMandiQuery(userText) || extractMandiQuery(conversationHistoryText);

  let mandis: AgentMandiInfo[] = state.mandiMatches || [];
  if (!state.mandiId) {
    mandis = await toolSearchMandis({ query: extractedQuery });
  }

  if (mandis.length === 0 && !state.mandiId) {
    return {
      ...state,
      intent: "BOOK_SLOT",
      confirmationRequired: false,
      responseText: lang === "hi"
        ? "मुझे डेटाबेस में कोई मंडी नहीं मिली। कृपया मंडी का नाम बताएँ (जैसे 'Rupesh Mandi')।"
        : lang === "mr"
        ? "मला डेटाबेसमध्ये कोणतीही मंडी सापडली नाही. कृपया मंडीचे नाव सांगा."
        : "No APMC mandi matching your request was found in the database. Please specify a valid mandi name.",
    };
  }

  const selectedMandi = state.mandiInfo || mandis[0] || { id: "mandi-default", name: "APMC Mandi" };
  const mandiId = state.mandiId || selectedMandi.id;

  const availableSlots = await toolGetAvailableSlots({ mandiId, date: targetDate });

  if (!availableSlots || availableSlots.length === 0 || !availableSlots[0]) {
    return {
      ...state,
      intent: "BOOK_SLOT",
      mandiId,
      mandiInfo: selectedMandi,
      date: targetDate,
      confirmationRequired: false,
      responseText: lang === "hi"
        ? `${selectedMandi.name} में ${targetDate} के लिए कोई एक्टिव स्लॉट उपलब्ध नहीं है।`
        : lang === "mr"
        ? `${selectedMandi.name} मध्ये ${targetDate} साठी कोणतीही वेळ उपलब्ध नाही.`
        : `${selectedMandi.name} has no active arrival slots available on ${targetDate}. Please select another date.`,
    };
  }

  const selectedSlot = availableSlots[0];
  const slotDate = selectedSlot.date || targetDate;

  const capacityCheck = await toolCheckSlotCapacity({
    slotId: selectedSlot.slotId,
    quantityKg: parsedKg,
  });

  if (!capacityCheck.valid) {
    return {
      ...state,
      intent: "BOOK_SLOT",
      mandiId,
      mandiInfo: selectedMandi,
      slotId: selectedSlot.slotId,
      confirmationRequired: false,
      responseText: capacityCheck.reason || "This slot does not have sufficient remaining capacity.",
    };
  }

  const rateInfo = await toolGetCropRate({ crop: cropNorm.name });
  const estimatedPayout = Math.round(parsedKg * rateInfo.ratePerKg);

  try {
    const promptWithContext = `User Prompt: "${userText}"
Ground Truth from PostgreSQL DB:
- Mandi Name: ${selectedMandi.name}
- Slot Date: ${slotDate} (${selectedSlot.startTime} to ${selectedSlot.endTime})
- Crop: ${cropNorm.name}
- Requested Quantity: ${parsedKg} KG
- Rate per KG: ₹${rateInfo.ratePerKg}
- Total Payout: ₹${estimatedPayout}
- Requested Language: ${lang}

Generate a warm, polite response strictly in language "${lang}". Include details: Mandi name, Date, Slot time, Crop name, Quantity in KG, Estimated payout amount (₹), and ask if they would like to submit/confirm the booking request.`;

    const aiRes = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: promptWithContext },
    ]);

    if (aiRes.content && aiRes.content.trim()) {
      const confirmationPayload: BookingConfirmationPayload = {
        mandiId,
        mandiName: selectedMandi.name,
        slotId: selectedSlot.slotId,
        date: slotDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        crop: cropNorm.name,
        quantityKg: parsedKg,
        ratePerKg: rateInfo.ratePerKg,
        estimatedPayout,
        remainingCapacity: selectedSlot.availableBookings,
        idempotencyKey: `IDEM-${state.conversationId}-${Date.now().toString().slice(-6)}`,
      };

      const slotInfo = { ...selectedSlot, date: slotDate };

      return {
        ...state,
        intent: "BOOK_SLOT",
        mandiId,
        mandiInfo: selectedMandi,
        date: slotDate,
        slotId: selectedSlot.slotId,
        slotInfo,
        crops: [{ cropId: cropNorm.cropId, name: cropNorm.name, quantityKg: parsedKg, ratePerKg: rateInfo.ratePerKg, estimatedAmount: estimatedPayout }],
        confirmationRequired: true,
        confirmationPayload,
        responseText: aiRes.content,
      };
    }
  } catch (err: any) {
    console.warn("Groq LLM call error, falling back to database formatter:", err?.message);
  }

  const confirmationPayload: BookingConfirmationPayload = {
    mandiId,
    mandiName: selectedMandi.name,
    slotId: selectedSlot.slotId,
    date: slotDate,
    startTime: selectedSlot.startTime,
    endTime: selectedSlot.endTime,
    crop: cropNorm.name,
    quantityKg: parsedKg,
    ratePerKg: rateInfo.ratePerKg,
    estimatedPayout,
    remainingCapacity: selectedSlot.availableBookings,
    idempotencyKey: `IDEM-${state.conversationId}-${Date.now().toString().slice(-6)}`,
  };

  let responseText = `Slot available at ${selectedMandi.name} on ${slotDate} (${selectedSlot.startTime} – ${selectedSlot.endTime}).\nCrop: ${cropNorm.name} (${parsedKg} KG)\nEstimated Payout: ₹${estimatedPayout.toLocaleString("en-IN")} (Rate: ₹${rateInfo.ratePerKg}/KG)\n\nWould you like me to submit this booking request? (Say Yes or tap Confirm)`;

  if (lang === "hi") {
    responseText = `${selectedMandi.name} में ${slotDate} को सुबह ${selectedSlot.startTime} – ${selectedSlot.endTime} का स्लॉट उपलब्ध है।\nफसल: ${cropNorm.name} (${parsedKg} KG)\nअनुमानित मूल्य: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)\n\nक्या मैं यह booking request सबमिट कर दूँ? (हाँ / Confirm कहें)`;
  } else if (lang === "mr") {
    responseText = `${selectedMandi.name} मध्ये ${slotDate} रोजी सकाळी ${selectedSlot.startTime} – ${selectedSlot.endTime} चा स्लॉट उपलब्ध आहे.\nपीक: ${cropNorm.name} (${parsedKg} KG)\nअंदाजे उत्पन्न: ₹${estimatedPayout.toLocaleString("en-IN")} (दर: ₹${rateInfo.ratePerKg}/KG)\n\nमी ही बुकिंग विनंती सबमिट करू का? (होय / Confirm म्हणा)`;
  }

  const slotInfo = { ...selectedSlot, date: slotDate };

  return {
    ...state,
    intent: "BOOK_SLOT",
    mandiId,
    mandiInfo: selectedMandi,
    date: slotDate,
    slotId: selectedSlot.slotId,
    slotInfo,
    crops: [{ cropId: cropNorm.cropId, name: cropNorm.name, quantityKg: parsedKg, ratePerKg: rateInfo.ratePerKg, estimatedAmount: estimatedPayout }],
    confirmationRequired: true,
    confirmationPayload,
    responseText,
  };
}
