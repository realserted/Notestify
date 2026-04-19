import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quiz, QuizQuestion, QuizAttempt } from '@/types/database';

export interface NewQuestionInput {
  question: string;
  question_type: QuizQuestion['question_type'];
  options: string[] | null;
  correct_answer: string;
  explanation?: string | null;
  position?: number;
}

export const quizService = {
  list: async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(count), quiz_attempts(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getWithQuestions: async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Quiz & { quiz_questions: QuizQuestion[] };
  },

  create: async (
    supabase: SupabaseClient,
    quiz: {
      user_id: string;
      title: string;
      description?: string;
      deck_id?: string;
      source?: Quiz['source'];
    },
    questions: NewQuestionInput[]
  ) => {
    const { data: newQuiz, error } = await supabase.from('quizzes').insert(quiz).select().single();
    if (error) throw error;

    const rows = questions.map((q, i) => ({
      quiz_id: newQuiz.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      position: q.position ?? i,
    }));

    const { error: qError } = await supabase.from('quiz_questions').insert(rows);
    if (qError) throw qError;

    return newQuiz as Quiz;
  },

  submit: async (
    supabase: SupabaseClient,
    params: {
      user_id: string;
      quiz_id: string;
      answers: Record<string, string>;
      time_taken_seconds?: number;
    }
  ) => {
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', params.quiz_id);
    if (qError) throw qError;

    const typedQuestions = questions as QuizQuestion[];
    let correctCount = 0;
    const answerRows = typedQuestions.map((q) => {
      const userAnswer = params.answers[q.id]?.trim() ?? '';
      const isCorrect = userAnswer.toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (isCorrect) correctCount += 1;
      return { question_id: q.id, user_answer: userAnswer, is_correct: isCorrect };
    });

    const total = typedQuestions.length;
    const score = total > 0 ? Number(((correctCount / total) * 100).toFixed(2)) : 0;

    const { data: attempt, error: aError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: params.user_id,
        quiz_id: params.quiz_id,
        score,
        total_questions: total,
        correct_count: correctCount,
        time_taken_seconds: params.time_taken_seconds ?? null,
      })
      .select()
      .single();
    if (aError) throw aError;

    const { error: ansError } = await supabase
      .from('quiz_answers')
      .insert(answerRows.map((a) => ({ ...a, attempt_id: attempt.id })));
    if (ansError) throw ansError;

    return { attempt: attempt as QuizAttempt, correctCount, total, score };
  },
};
