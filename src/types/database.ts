export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type FlashcardSource = 'manual' | 'ai' | 'pdf';
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_reviewed_at: string | null;
  source: FlashcardSource;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  deck_id: string | null;
  title: string;
  description: string | null;
  source: 'manual' | 'ai' | 'deck' | 'pdf';
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  position: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  time_taken_seconds: number | null;
  completed_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  extracted_text: string | null;
  summary: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

export type NotebookCover = 'coral' | 'cream' | 'ink' | 'sage' | 'sky' | 'plum' | 'butter';
export type PaperStyle = 'blank' | 'ruled' | 'grid' | 'dotted' | 'cornell';

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  cover_color: NotebookCover;
  created_at: string;
  updated_at: string;
}

export interface Stroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  size: number;
  points: Array<[number, number, number]>;
}

export interface Note {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  paper_style: PaperStyle;
  content: unknown;
  strokes: Stroke[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
