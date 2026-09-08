import { Request, Response, NextFunction } from "express";
import {
  processAiTextMessage,
  processAiVoiceMessage,
  getAiConversationHistory,
} from "../services/ai.service.js";

/**
 * Controller handling text prompt submissions to AI agent
 */
export async function handleSendAiMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { conversationId, message, language, confirmed, idempotencyKey } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        success: false,
        message: "Message prompt text is required.",
        code: "INVALID_PROMPT",
      });
      return;
    }

    const payload = await processAiTextMessage(userId, {
      conversationId,
      message: message.trim(),
      language,
      confirmed: Boolean(confirmed),
      idempotencyKey,
    });

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller handling multipart audio voice submissions to AI agent
 */
export async function handleSendAiVoiceMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file || !file.buffer) {
      res.status(400).json({
        success: false,
        message: "Audio file is required for voice assistant.",
        code: "AUDIO_REQUIRED",
      });
      return;
    }

    const { conversationId, languageHint, confirmed, idempotencyKey } = req.body;

    const payload = await processAiVoiceMessage(userId, file.buffer, {
      conversationId,
      languageHint,
      confirmed: confirmed === "true" || confirmed === true,
      idempotencyKey,
    });

    res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller retrieving history of a specific AI conversation
 */
export async function handleGetAiConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const conversationId = String(req.params.id || "");

    const conversation = await getAiConversationHistory(userId, conversationId);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
}
