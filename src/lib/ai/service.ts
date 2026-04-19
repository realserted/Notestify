import { getGeminiModel, extractJSON } from './gemini';
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

const truncate = (text: string) =>
  text.length > MAX_CONTENT_CHARS ? text.slice(0, MAX_CONTENT_CHARS) : text;

export const generateFlashcards = async (
  content: string,
  count = 10
): Promise<GeneratedFlashcard[]> => {
  const model = getGeminiModel();
  const result = await model.generateContent(flashcardPrompt(truncate(content), count));
  return extractJSON<GeneratedFlashcard[]>(result.response.text());
};

export const generateQuiz = async (
  content: string,
  count = 10
): Promise<GeneratedQuestion[]> => {
  const model = getGeminiModel();
  const result = await model.generateContent(quizPrompt(truncate(content), count));
  return extractJSON<GeneratedQuestion[]>(result.response.text());
};

export const generateSummary = async (content: string): Promise<string> => {
  const model = getGeminiModel();
  const result = await model.generateContent(summaryPrompt(truncate(content)));
  return result.response.text();
};

export const chatWithTutor = async (history: TutorChatMessage[]): Promise<string> => {
  const model = getGeminiModel('gemini-2.5-flash', tutorSystemPrompt);
  const chat = model.startChat({
    history: history.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  });

  const last = history[history.length - 1];
  const result = await chat.sendMessage(last.content);
  return result.response.text();
};
