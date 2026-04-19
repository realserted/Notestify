'use client';

import { useState } from 'react';
import type { Quiz, QuizQuestion } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface QuizResult {
  score: number;
  correctCount: number;
  total: number;
}

interface Props {
  quiz: Quiz & { quiz_questions: QuizQuestion[] };
}

export const QuizRunner = ({ quiz }: Props) => {
  const questions = [...quiz.quiz_questions].sort((a, b) => a.position - b.position);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startedAt] = useState(Date.now());

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        time_taken_seconds: Math.floor((Date.now() - startedAt) / 1000),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="text-center">
          <h2 className="text-3xl font-bold">{result.score}%</h2>
          <p className="mt-2 text-ink-500">
            {result.correctCount} / {result.total} correct
          </p>
        </Card>

        {questions.map((q, i) => {
          const userAnswer = answers[q.id] ?? '';
          const isCorrect = userAnswer.toLowerCase() === q.correct_answer.toLowerCase();
          return (
            <Card key={q.id}>
              <p className="mb-2 text-sm font-medium text-ink-500">Q{i + 1}</p>
              <p className="font-semibold">{q.question}</p>
              <p className={`mt-2 text-sm ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                Your answer: {userAnswer || '(no answer)'}
              </p>
              {!isCorrect && (
                <p className="mt-1 text-sm text-ink-700">Correct: {q.correct_answer}</p>
              )}
              {q.explanation && <p className="mt-2 text-sm text-ink-500">{q.explanation}</p>}
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-ink-500">{questions.length} questions</p>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <p className="mb-2 text-sm font-medium text-ink-500">Q{i + 1}</p>
          <p className="mb-4 font-semibold">{q.question}</p>

          {q.question_type === 'multiple_choice' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded border border-cream-200 p-3 hover:bg-cream-50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'true_false' && (
            <div className="flex gap-2">
              {['true', 'false'].map((opt) => (
                <label
                  key={opt}
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-cream-200 p-3 hover:bg-cream-50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                  <span className="capitalize">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.question_type === 'short_answer' && (
            <input
              type="text"
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              className="w-full rounded-md border border-cream-200 px-3 py-2 outline-none focus:border-coral-500"
              placeholder="Your answer…"
            />
          )}
        </Card>
      ))}

      <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg">
        Submit Quiz
      </Button>
    </div>
  );
};
