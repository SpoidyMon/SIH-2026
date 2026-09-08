import { prisma } from "../lib/prisma.js";
import {
  TextMessageInput,
  VoiceMessageInput,
  AgentResponsePayload,
  BookingAgentState,
} from "../interfaces/index.js";
import { transcribeAudio } from "../ai/provider/groq.provider.js";
import { runBookingAgent } from "../ai/agent/bookingAgent.js";

/**
 * Handles text-based AI assistant conversation step.
 */
export async function processAiTextMessage(
  userId: string,
  input: TextMessageInput
): Promise<AgentResponsePayload> {
  let conversationId = input.conversationId;

  // 1. Get or create conversation record
  if (conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!existing) {
      conversationId = undefined;
    }
  }

  if (!conversationId) {
    const newConv = await prisma.aIConversation.create({
      data: {
        userId,
        language: input.language || "hi",
        idempotencyKey: input.idempotencyKey || `CONV-${Date.now()}`,
      },
    });
    conversationId = newConv.id;
  }

  // Save user message to database
  await prisma.aIMessage.create({
    data: {
      conversationId,
      sender: "user",
      content: input.message,
    },
  });

  // 2. Build initial agent state
  const initialState: BookingAgentState = {
    userId,
    conversationId,
    language: input.language || "hi",
    userMessage: input.message,
    confirmed: Boolean(input.confirmed),
    confirmationRequired: false,
  };

  // 3. Execute agent state machine
  const finalState = await runBookingAgent(initialState);

  // 4. Save assistant response to database
  await prisma.aIMessage.create({
    data: {
      conversationId,
      sender: "assistant",
      content: finalState.responseText || "क्षमा करें, मैं आपकी सहायता नहीं कर पाया।",
      toolResults: finalState.confirmationPayload ? (finalState.confirmationPayload as any) : undefined,
    },
  });

  // 5. Update last intent on conversation
  if (finalState.intent) {
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { lastIntent: finalState.intent },
    });
  }

  let bookingResult = null;
  if (finalState.confirmed && finalState.bookingId) {
    bookingResult = {
      id: finalState.bookingId,
      token: finalState.bookingToken || "PENDING",
      status: finalState.bookingStatus || "PENDING",
      crop: finalState.confirmationPayload?.crop || "Wheat",
      quantityKg: finalState.confirmationPayload?.quantityKg || 100,
      mandiName: finalState.confirmationPayload?.mandiName || "Mandi",
      date: finalState.confirmationPayload?.date || "",
      startTime: finalState.confirmationPayload?.startTime || "",
      endTime: finalState.confirmationPayload?.endTime || "",
    };
  }

  return {
    conversationId,
    responseText: finalState.responseText || "",
    language: input.language || "hi",
    requiresConfirmation: finalState.confirmationRequired,
    confirmationPayload: finalState.confirmationPayload || null,
    bookingResult,
    intent: finalState.intent || "BOOK_SLOT",
    error: finalState.error || null,
  };
}

/**
 * Handles voice-based AI assistant message by transcribing audio and processing text agent.
 */
export async function processAiVoiceMessage(
  userId: string,
  audioBuffer: Buffer,
  input: VoiceMessageInput
): Promise<AgentResponsePayload> {
  // Transcribe voice audio buffer via Groq Whisper API
  const transcript = await transcribeAudio(
    audioBuffer,
    "farmer_voice.webm",
    input.languageHint
  );

  const textPayload = await processAiTextMessage(userId, {
    conversationId: input.conversationId,
    message: transcript,
    language: input.languageHint || "hi",
    confirmed: input.confirmed,
    idempotencyKey: input.idempotencyKey,
  });

  return {
    ...textPayload,
    transcript,
  };
}

/**
 * Fetches past conversation messages for the authenticated farmer.
 */
export async function getAiConversationHistory(userId: string, conversationId: string) {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw { status: 404, message: "Conversation not found", code: "CONVERSATION_NOT_FOUND" };
  }

  return conversation;
}
