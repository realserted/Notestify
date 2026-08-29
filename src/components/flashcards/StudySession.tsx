'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Flashcard } from '@/types/database';
import { Button } from '@/components/ui/Button';

interface Props {
  initialCards: Flashcard[];
  deckId: string;
}

// SM-2 quality values are unchanged; only the colours are new.
const QUALITY_LABELS = [
  { value: 0, label: 'Again', color: 'bg-clay-500 text-espresso-700' },
  { value: 3, label: 'Hard', color: 'bg-citrus-300 text-espresso-700' },
  { value: 4, label: 'Good', color: 'bg-olive-300 text-espresso-700' },
  { value: 5, label: 'Easy', color: 'bg-espresso-500 text-paper-50 dark:bg-citrus-500 dark:text-espresso-900' },
];

/** Above this many cards the per-card pills get too thin to read. */
const MAX_PILLS = 20;

export const StudySession = ({ initialCards, deckId }: Props) => {
  const router = useRouter();
  const [cards] = useState(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [streak, setStreak] = useState(0);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <h2 className="font-display text-[32px] font-extrabold tracking-[-0.03em]">
          All caught up!
        </h2>
        <p className="text-bark-500 dark:text-bark-300">No cards are due right now.</p>
        <Button onClick={() => router.push(`/decks/${deckId}`)}>Back to deck</Button>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <h2 className="font-display text-[32px] font-extrabold tracking-[-0.03em]">
          Session complete!
        </h2>
        <p className="text-bark-500 dark:text-bark-300">You reviewed {cards.length} cards.</p>
        <Button onClick={() => router.push(`/decks/${deckId}`)}>Back to deck</Button>
      </div>
    );
  }

  const current = cards[index];

  const handleReview = async (quality: number) => {
    setReviewing(true);
    await fetch(`/api/flashcards/${current.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    });
    setReviewing(false);
    setFlipped(false);
    setStreak((s) => (quality >= 3 ? s + 1 : 0));
    setIndex((i) => i + 1);
  };

  return (
    <div className="space-y-[18px]">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Study</h1>
        {streak > 1 && (
          <span className="rounded-full border-2 border-espresso-700 bg-paper-50 px-4 py-1.5 text-[13px] font-bold dark:border-night-600 dark:bg-night-800">
            {streak} in a row
          </span>
        )}
      </div>

      {cards.length <= MAX_PILLS ? (
        <div className="flex gap-1.5" aria-hidden>
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full border-2 border-espresso-700 dark:border-night-600 ${
                i < index
                  ? 'bg-citrus-500'
                  : i === index
                    ? 'bg-espresso-500 dark:bg-foam-50'
                    : 'bg-paper-50 dark:bg-night-800'
              }`}
            />
          ))}
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-sm font-semibold text-bark-500 dark:text-bark-300">
            <span>
              Card {index + 1} of {cards.length}
            </span>
            <span>{cards.length - index - 1} remaining</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full border-2 border-espresso-700 bg-paper-50 dark:border-night-600 dark:bg-night-800">
            <div
              className="h-full bg-citrus-500 transition-all duration-150"
              style={{ width: `${(index / cards.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <div className="w-full max-w-[660px]">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="w-full overflow-hidden rounded-3xl border-2 border-espresso-700 bg-paper-50 text-left shadow-[7px_7px_0_#2E1A0E] dark:border-night-600 dark:bg-night-800 dark:shadow-[7px_7px_0_#0E0805]"
          >
            {/* The strip is the flip tell: espresso on the question, citrus on the answer. */}
            <span
              className={`block h-3 border-b-2 border-espresso-700 dark:border-night-600 ${
                flipped ? 'bg-citrus-500' : 'bg-espresso-500 dark:bg-night-700'
              }`}
            />
            <span className="block min-h-[196px] px-[34px] pb-10 pt-[34px]">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-bark-500 dark:text-bark-300">
                {flipped ? 'Answer' : 'Question'} · card {index + 1} of {cards.length}
              </span>
              <span className="mt-3.5 block font-display text-[28px] font-semibold leading-[1.32] tracking-[-0.025em]">
                {flipped ? current.back : current.front}
              </span>
            </span>
          </button>

          {!flipped ? (
            <p className="mt-5 text-center text-[13.5px] font-bold text-bark-500 dark:text-bark-300">
              Tap the card when you&apos;ve got it
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUALITY_LABELS.map((q) => (
                <button
                  key={q.value}
                  disabled={reviewing}
                  onClick={() => handleReview(q.value)}
                  className={`rounded-full border-2 border-espresso-700 py-3.5 text-center text-sm font-bold shadow-pop transition-all duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-espresso-900 dark:shadow-pop-dark ${q.color}`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
