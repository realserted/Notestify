'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Flashcard } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  initialCards: Flashcard[];
  deckId: string;
}

const QUALITY_LABELS = [
  { value: 0, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { value: 3, label: 'Hard', color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 4, label: 'Good', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 5, label: 'Easy', color: 'bg-indigo-500 hover:bg-indigo-600' },
];

export const StudySession = ({ initialCards, deckId }: Props) => {
  const router = useRouter();
  const [cards] = useState(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">All caught up! 🎉</h2>
        <p className="text-slate-500">No cards are due right now.</p>
        <Button onClick={() => router.push(`/decks/${deckId}`)}>Back to deck</Button>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Session complete!</h2>
        <p className="text-slate-500">You reviewed {cards.length} cards.</p>
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
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>{cards.length - index - 1} remaining</span>
      </div>

      <Card
        className="min-h-[300px] cursor-pointer p-12 text-center"
        onClick={() => setFlipped((f) => !f)}
      >
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {flipped ? 'Answer' : 'Question'}
        </p>
        <p className="mt-6 text-xl">{flipped ? current.back : current.front}</p>
        {!flipped && <p className="mt-8 text-xs text-slate-400">Click to reveal</p>}
      </Card>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_LABELS.map((q) => (
            <button
              key={q.value}
              disabled={reviewing}
              onClick={() => handleReview(q.value)}
              className={`rounded-md px-4 py-3 text-sm font-medium text-white transition ${q.color} disabled:opacity-60`}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
