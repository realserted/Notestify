'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import type { Flashcard } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface Props {
  initialCards: Flashcard[];
  deckId: string;
}

// SM-2 quality values are unchanged; the key is the 1-4 shortcut.
const QUALITY_LABELS = [
  { value: 0, key: '1', label: 'Again', color: 'bg-clay-500 text-espresso-700' },
  { value: 3, key: '2', label: 'Hard', color: 'bg-citrus-300 text-espresso-700' },
  { value: 4, key: '3', label: 'Good', color: 'bg-olive-300 text-espresso-700' },
  {
    value: 5,
    key: '4',
    label: 'Easy',
    color: 'bg-espresso-500 text-paper-50 dark:bg-citrus-500 dark:text-espresso-900',
  },
];

/** Above this many cards the per-card pills get too thin to read. */
const MAX_PILLS = 20;

/** True when focus is somewhere that should swallow the keystroke. */
const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
};

export const StudySession = ({ initialCards, deckId }: Props) => {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [streak, setStreak] = useState(0);

  const [editing, setEditing] = useState(false);
  const [draftFront, setDraftFront] = useState('');
  const [draftBack, setDraftBack] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const frontRef = useRef<HTMLTextAreaElement>(null);

  const done = index >= cards.length;
  const current = done ? undefined : cards[index];

  const handleReview = useCallback(
    async (quality: number) => {
      if (!current || reviewing) return;
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
    },
    [current, reviewing]
  );

  const startEditing = useCallback(() => {
    if (!current) return;
    setDraftFront(current.front);
    setDraftBack(current.back);
    setEditError('');
    setEditing(true);
  }, [current]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditError('');
  }, []);

  const saveEdit = async () => {
    if (!current) return;
    setSaving(true);
    setEditError('');

    const res = await fetch(`/api/flashcards/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: draftFront, back: draftBack }),
    });
    setSaving(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Could not save the card.' }));
      setEditError(typeof error === 'string' ? error : 'Could not save the card.');
      return;
    }

    // Keep the session in sync without refetching the whole deck.
    setCards((prev) =>
      prev.map((c) => (c.id === current.id ? { ...c, front: draftFront, back: draftBack } : c))
    );
    setEditing(false);
  };

  useEffect(() => {
    if (editing) frontRef.current?.focus();
  }, [editing]);

  // Space/Enter to flip, 1-4 to grade, E to edit, Escape to back out.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEditing();
        }
        return;
      }

      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (done || !current) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        startEditing();
        return;
      }

      if (flipped) {
        const grade = QUALITY_LABELS.find((q) => q.key === e.key);
        if (grade) {
          e.preventDefault();
          void handleReview(grade.value);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing, done, current, flipped, handleReview, startEditing, cancelEditing]);

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

  if (done) {
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
          {editing ? (
            <div className="overflow-hidden rounded-3xl border-2 border-espresso-700 bg-paper-50 shadow-[7px_7px_0_#2E1A0E] dark:border-night-600 dark:bg-night-800 dark:shadow-[7px_7px_0_#0E0805]">
              <span className="block h-3 border-b-2 border-espresso-700 bg-citrus-300 dark:border-night-600" />
              <div className="space-y-4 px-[34px] pb-8 pt-7">
                <Textarea
                  ref={frontRef}
                  id="card-front"
                  label="Question"
                  rows={3}
                  value={draftFront}
                  onChange={(e) => setDraftFront(e.target.value)}
                />
                <Textarea
                  id="card-back"
                  label="Answer"
                  rows={4}
                  value={draftBack}
                  onChange={(e) => setDraftBack(e.target.value)}
                />
                {editError && (
                  <p className="text-sm font-semibold text-clay-500 dark:text-clay-300">
                    {editError}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={saveEdit}
                    loading={saving}
                    disabled={!draftFront.trim() || !draftBack.trim()}
                  >
                    Save card
                  </Button>
                  <Button variant="ghost" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
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
                    {flipped ? current!.back : current!.front}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit this card"
                title="Edit this card (E)"
                className="absolute right-4 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-espresso-700 bg-paper-50 text-bark-700 transition-colors hover:bg-paper-200 dark:border-night-600 dark:bg-night-700 dark:text-foam-50 dark:hover:bg-night-600"
              >
                <Pencil size={15} />
              </button>
            </div>
          )}

          {!editing &&
            (!flipped ? (
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
                    <span className="ml-1.5 opacity-60">{q.key}</span>
                  </button>
                ))}
              </div>
            ))}

          {!editing && (
            <p className="mt-5 hidden text-center text-[12px] font-semibold text-bark-500 dark:text-bark-300 sm:block">
              <Kbd>Space</Kbd> flip · <Kbd>1</Kbd>–<Kbd>4</Kbd> grade · <Kbd>E</Kbd> edit
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border-2 border-paper-300 bg-paper-50 px-1.5 py-0.5 font-sans text-[11px] font-bold text-bark-700 dark:border-night-600 dark:bg-night-800 dark:text-foam-50">
    {children}
  </kbd>
);
