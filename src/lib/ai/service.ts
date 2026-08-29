import { getGeminiModel, extractJSON, readResponseText } from './gemini';
import { flashcardPrompt, quizPrompt, summaryPrompt, tutorSystemPrompt } from './prompts';
import type { QuestionType } from '@/types/database';

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GeneratedQuestion {
  question: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

export interface TutorChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_CONTENT_CHARS = 30_000;

/** Longest single tutor message sent upstream. Mirrors the zod cap on the route. */
export const MAX_TUTOR_MESSAGE_CHARS = 4_000;

/**
 * How many prior messages get replayed. The whole history was previously sent
 * every turn, so a long session's cost grew quadratically.
 */
const MAX_HISTORY_MESSAGES = 20;

const truncate = (text: string, max = MAX_CONTENT_CHARS) =>
  text.length > max ? text.slice(0, max) : text;

export const generateFlashcards = async (
  content: string,
  count = 10
): Promise<GeneratedFlashcard[]> => {
  const model = getGeminiModel();
  const result = await model.generateContent(flashcardPrompt(truncate(content), count));
  return extractJSON<GeneratedFlashcard[]>(readResponseText(result.response));
};

export const generateQuiz = async (content: string, count = 10): Promise<GeneratedQuestion[]> => {
  const model = getGeminiModel();
  const result = await model.generateContent(quizPrompt(truncate(content), count));
  return extractJSON<GeneratedQuestion[]>(readResponseText(result.response));
};

export const generateSummary = async (content: string): Promise<string> => {
  const model = getGeminiModel();
  const result = await model.generateContent(summaryPrompt(truncate(content)));
  return readResponseText(result.response);
};

export const chatWithTutor = async (history: TutorChatMessage[]): Promise<string> => {
  const model = getGeminiModel('gemini-2.5-flash', tutorSystemPrompt);

  // Keep the most recent turns, and bound each one.
  const recent = history.slice(-MAX_HISTORY_MESSAGES);
  const last = recent[recent.length - 1];

  const chat = model.startChat({
    history: recent.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: truncate(m.content, MAX_TUTOR_MESSAGE_CHARS) }],
    })),
  });

  const result = await chat.sendMessage(truncate(last.content, MAX_TUTOR_MESSAGE_CHARS));
  return readResponseText(result.response);
};
