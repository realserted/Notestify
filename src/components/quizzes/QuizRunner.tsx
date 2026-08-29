'use client';

import { useState } from 'react';
import type { Quiz, QuizQuestion } from '@/types/database';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface QuizResult {
  score: number;
  correctCount: number;
  total: number;
}

interface Props {
  quiz: Quiz & { quiz_questions: QuizQuestion[] };
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / false',
  short_answer: 'Short answer',
};

const TYPE_FILLS: Record<string, string> = {
  multiple_choice: 'bg-citrus-500',
  true_false: 'bg-espresso-500 dark:bg-foam-50',
  short_answer: 'bg-clay-500',
};

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

export const QuizRunner = ({ quiz }: Props) => {
  const questions = [...quiz.quiz_questions].sort((a, b) => a.position - b.position);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const isCorrect = (q: QuizQuestion) =>
    (answers[q.id] ?? '').trim().toLowerCase() === q.correct_answer.trim().toLowerCase();

  const handleSubmit = async () => {
    setSubmitting(true);
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, time_taken_seconds: seconds }),
    });
    setSubmitting(false);
    if (res.ok) {
      setElapsed(seconds);
      setResult(await res.json());
    }
  };

  if (result) {
    const missed = questions.filter((q) => !isCorrect(q));

    // Per-type breakdown for the meters, grouped from the questions themselves.
    const breakdown = Object.entries(
      questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
        const entry = acc[q.question_type] ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (isCorrect(q)) entry.correct += 1;
        acc[q.question_type] = entry;
        return acc;
      }, {})
    );

    return (
      <div className="mx-auto max-w-[760px] space-y-[18px]">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">{quiz.title}</h1>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-pop-lg border-2 border-espresso-700 bg-espresso-500 p-6 shadow-[5px_5px_0_#2E1A0E] dark:border-night-600 dark:bg-night-700 dark:shadow-[5px_5px_0_#0E0805]">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-paper-200">
              You scored
            </p>
            <p className="mt-1.5 font-display text-[88px] font-extrabold leading-[0.95] tracking-[-0.05em] text-paper-50">
              {result.score}%
            </p>
            <p className="mt-2 text-sm font-semibold text-paper-200">
              {result.correctCount} of {result.total} correct · {formatDuration(elapsed)}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-[18px] rounded-pop-lg border-2 border-espresso-700 bg-paper-50 p-6 shadow-[5px_5px_0_#2E1A0E] dark:border-night-600 dark:bg-night-800 dark:shadow-[5px_5px_0_#0E0805]">
            {breakdown.map(([type, { correct, total }]) => (
              <div key={type}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold">{TYPE_LABELS[type] ?? type}</span>
                  <span className="text-[13px] font-bold text-bark-500 dark:text-bark-300">
                    {correct} / {total}
                  </span>
                </div>
                <div className="mt-2 h-3.5 overflow-hidden rounded-full border-2 border-espresso-700 bg-paper-200 dark:border-night-600 dark:bg-night-700">
                  <div
                    className={`h-full ${TYPE_FILLS[type] ?? 'bg-citrus-500'}`}
                    style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 shadow-[5px_5px_0_#2E1A0E] dark:shadow-[5px_5px_0_#0E0805]">
          <div className="flex items-baseline justify-between">
            <CardTitle className="text-[19px]">Worth another look</CardTitle>
            <span className="text-[13px] font-bold text-bark-500 dark:text-bark-300">
              {missed.length} {missed.length === 1 ? 'question' : 'questions'}
            </span>
          </div>

          {missed.length === 0 ? (
            <p className="mt-4 text-sm text-bark-500 dark:text-bark-300">
              Nothing missed — a clean sweep.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {questions.map((q) => {
                const correct = isCorrect(q);
                const given = answers[q.id] ?? '';
                return (
                  <div key={q.id} className="grid grid-cols-[30px_1fr] items-start gap-3.5">
                    <span
                      className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-espresso-700 text-sm font-bold text-espresso-700 dark:border-espresso-900 ${
                        correct ? 'bg-citrus-500' : 'bg-clay-500'
                      }`}
                      aria-hidden
                    >
                      {correct ? '✓' : '✕'}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-bold leading-snug">{q.question}</p>
                      <p className="mt-1 text-[13px] font-semibold text-bark-500 dark:text-bark-300">
                        You said{' '}
                        <span
                          className={
                            correct
                              ? 'font-bold text-olive-500 dark:text-olive-300'
                              : 'font-bold text-clay-500 dark:text-clay-300'
                          }
                        >
                          {given || '(no answer)'}
                        </span>
                      </p>
                      {!correct && (
                        <p className="mt-0.5 text-[13px] font-semibold text-olive-500 dark:text-olive-300">
                          Answer: {q.correct_answer}
                        </p>
                      )}
                      {!correct && q.explanation && (
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-bark-500 dark:text-bark-300">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retake quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const answeredCount = questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length;

  return (
    <div className="mx-auto max-w-[720px] space-y-[18px]">
      <div>
        <h1 className="font-display text-[30px] font-extrabold tracking-[-0.03em]">{quiz.title}</h1>
        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500 dark:text-bark-300">
          {questions.length} questions · {answeredCount} answered
        </p>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id} className="p-[22px]">
          <div className="flex gap-3.5">
            <span className="pt-0.5 text-[13px] font-bold text-citrus-600">Q{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[19px] font-semibold leading-snug">{q.question}</p>

              {q.question_type === 'multiple_choice' && q.options && (
                <div className="mt-4 flex flex-col border-t-2 border-paper-200 dark:border-night-700">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-3 border-b-2 border-paper-200 py-2.5 text-sm last:border-0 dark:border-night-700 ${
                          selected ? 'font-bold' : 'text-bark-700 dark:text-foam-50/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="sr-only"
                        />
                        <span
                          className={`h-[11px] w-[11px] shrink-0 border-2 border-espresso-700 dark:border-night-600 ${
                            selected ? 'bg-espresso-500 dark:bg-foam-50' : 'bg-transparent'
                          }`}
                          aria-hidden
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'true_false' && (
                <div className="mt-4 flex gap-2.5">
                  {['true', 'false'].map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex-1 cursor-pointer rounded-pop border-2 py-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] ${
                          selected
                            ? 'border-espresso-700 bg-paper-200 text-espresso-700 dark:border-foam-50 dark:bg-night-700 dark:text-foam-50'
                            : 'border-paper-300 text-bark-500 dark:border-night-600 dark:text-bark-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="sr-only"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'short_answer' && (
                <input
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Your answer…"
                  className="mt-4 w-full rounded-pop border-2 border-espresso-700 bg-paper-50 px-4 py-2.5 text-sm outline-none transition-shadow placeholder:text-bark-500/70 focus:shadow-pop-sm dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:focus:shadow-pop-dark"
                />
              )}
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg">
        Submit quiz
      </Button>
    </div>
  );
};
