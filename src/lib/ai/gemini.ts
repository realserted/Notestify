import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type EnhancedGenerateContentResponse,
  type GenerationConfig,
  type SafetySetting,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Set explicitly rather than inheriting Google's defaults. This is a study app
 * used by students, so the thresholds are deliberately stricter than the
 * general-purpose defaults.
 */
const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/** Caps the cost of a single response. */
const GENERATION_CONFIG: GenerationConfig = { maxOutputTokens: 2048 };

export const getGeminiModel = (model = 'gemini-2.5-flash', systemInstruction?: string) =>
  genAI.getGenerativeModel({
    model,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: GENERATION_CONFIG,
    ...(systemInstruction && { systemInstruction }),
  });

/** Thrown when a request or response is stopped by a safety filter. */
export class ContentBlockedError extends Error {
  constructor(public readonly reason: string) {
    super(`Content blocked: ${reason}`);
    this.name = 'ContentBlockedError';
  }
}

/**
 * Reads the text out of a response, distinguishing a safety block from a
 * genuine failure. Calling `.text()` directly throws on a blocked response,
 * which otherwise surfaces to the user as a generic 500.
 */
export const readResponseText = (response: EnhancedGenerateContentResponse): string => {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) throw new ContentBlockedError(blockReason);

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
    throw new ContentBlockedError(finishReason);
  }

  const text = response.text();
  if (!text.trim()) throw new ContentBlockedError(finishReason ?? 'EMPTY');

  return text;
};

export const extractJSON = <T>(raw: string): T => {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  const jsonStr = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;

  return JSON.parse(jsonStr) as T;
};
