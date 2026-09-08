import Groq, { toFile } from "groq-sdk";
import { env } from "../../config/env.js";
import { AIProviderResponse, AIProvider } from "../../interfaces/index.js";

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY || "mock_key_for_dev",
    });
  }
  return groqInstance;
}

/**
 * Executes chat completions via Groq API (or mock fallback if API key not provided).
 */
export async function chatCompletion(
  messages: any[],
  tools?: any[]
): Promise<AIProviderResponse> {
  const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "mock_key_for_dev") {
    return fallbackChatCompletion(messages, tools);
  }

  try {
    const groq = getGroqClient();
    const params: any = {
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.2,
      max_completion_tokens: 1024,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = "auto";
    }

    const response = await groq.chat.completions.create(params);
    const choice = response.choices[0]?.message;

    const toolCalls = choice?.tool_calls?.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments:
        typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments,
    }));

    return {
      content: choice?.content || "",
      toolCalls,
    };
  } catch (err: any) {
    console.warn("Groq API call failed, falling back to heuristic parser:", err?.message);
    return fallbackChatCompletion(messages, tools);
  }
}

/**
 * Transcribes voice audio buffer using Groq Whisper API (or fallback for local dev).
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = "audio.webm",
  languageHint?: string
): Promise<string> {
  const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "mock_key_for_dev") {
    return "रुपेश की मंडी में कल सुबह 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो";
  }

  try {
    const groq = getGroqClient();
    const mimeType = filename.endsWith(".webm")
      ? "audio/webm"
      : filename.endsWith(".mp4") || filename.endsWith(".m4a")
      ? "audio/mp4"
      : filename.endsWith(".mp3")
      ? "audio/mp3"
      : "audio/wav";

    const file = await toFile(audioBuffer, filename, { type: mimeType });
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo",
      language: languageHint || undefined,
      prompt: "Agricultural mandi slot booking, crops wheat mustard rice quintal kg in Hindi Marathi English",
    });

    return transcription.text || "";
  } catch (err: any) {
    console.warn("Groq audio transcription failed, using fallback transcript:", err?.message);
    return "रुपेश की मंडी में कल सुबह 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो";
  }
}

/**
 * Heuristic fallback for offline / dev environment testing when GROQ_API_KEY is not set.
 */
function fallbackChatCompletion(messages: any[], tools?: any[]): AIProviderResponse {
  const lastUserMsg = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .pop() || "";

  const lower = lastUserMsg.toLowerCase();

  // If tools are provided and text contains booking intent
  if (tools && tools.length > 0) {
    if (lower.includes("book") || lower.includes("बुक") || lower.includes("गहू") || lower.includes("गेहूं") || lower.includes("slot")) {
      return {
        content: "",
        toolCalls: [
          {
            id: "call_search_mandi",
            name: "searchMandis",
            arguments: { query: "Rupesh" },
          },
        ],
      };
    }
  }

  return {
    content: "नमस्ते! मैं आपका मंडी सेतू एआई सहायक हूँ। आप किस मंडी में स्लॉट बुक करना चाहते हैं?",
  };
}

export const groqAIProvider: AIProvider = {
  chatCompletion,
  transcribeAudio,
};
