import type { SupabaseClient } from '@supabase/supabase-js';

/** A card counts as mature once SM-2 has pushed its interval past three weeks. */
const MATURE_INTERVAL_DAYS = 21;

export interface DeckDue {
  id: string;
  title: string;
  due: number;
  total: number;
}

export interface DashboardStats {
  totalDecks: number;
  totalFlashcards: number;
  dueToday: number;
  /** How many distinct decks have at least one card due. */
  dueDeckCount: number;
  /** Cards with an interval of 21+ days. */
  matureCards: number;
  streak: number;
  /** Reviews logged today — drives the "Today's goal" panel. */
  reviewedToday: number;
  /** Reviews per day for the last 7 days, oldest first. */
  weekReviews: Array<{ day: string; count: number }>;
  /** Decks with cards due, most due first. */
  dueDecks: DeckDue[];
  recentAttempts: Array<{ id: string; quiz_id: string; score: number; completed_at: string }>;
  weakTopics: Array<{ deck_id: string; deck_title: string; accuracy: number }>;
}

/** Local-date key. Streaks and daily counts have to follow the user's calendar,
 *  not UTC, or a late-night review lands on the wrong day. */
const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const computeStreak = (reviewDates: string[]): number => {
  if (reviewDates.length === 0) return 0;

  const uniqueDays = new Set(reviewDates.map((d) => dayKey(new Date(d))));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = dayKey(cursor);
    if (uniqueDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (!uniqueDays.has(dayKey(cursor))) break;
    } else {
      break;
    }
  }
  return streak;
};

export const dashboardService = {
  getStats: async (supabase: SupabaseClient, userId: string): Promise<DashboardStats> => {
    const now = new Date();
    const nowIso = now.toISOString();

    const [decksRes, cardsRes, logs, attempts] = await Promise.all([
      supabase.from('decks').select('id, title').eq('user_id', userId),
      // One pass over the cards gives totals, due counts, maturity and the
      // per-deck breakdown — cheaper than four separate count queries.
      supabase
        .from('flashcards')
        .select('deck_id, due_date, interval_days')
        .eq('user_id', userId),
      supabase
        .from('review_logs')
        .select('reviewed_at')
        .eq('user_id', userId)
        .order('reviewed_at', { ascending: false })
        .limit(365),
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5),
    ]);

    const decks = (decksRes.data ?? []) as Array<{ id: string; title: string }>;
    const cards = (cardsRes.data ?? []) as Array<{
      deck_id: string;
      due_date: string;
      interval_days: number;
    }>;

    let dueToday = 0;
    let matureCards = 0;
    const perDeck = new Map<string, { due: number; total: number }>();

    for (const card of cards) {
      const isDue = card.due_date <= nowIso;
      if (isDue) dueToday += 1;
      if (card.interval_days >= MATURE_INTERVAL_DAYS) matureCards += 1;

      const entry = perDeck.get(card.deck_id) ?? { due: 0, total: 0 };
      entry.total += 1;
      if (isDue) entry.due += 1;
      perDeck.set(card.deck_id, entry);
    }

    const dueDecks: DeckDue[] = decks
      .map((d) => ({ id: d.id, title: d.title, ...(perDeck.get(d.id) ?? { due: 0, total: 0 }) }))
      .filter((d) => d.due > 0)
      .sort((a, b) => b.due - a.due);

    const reviewDates = (logs.data ?? []).map((l: { reviewed_at: string }) => l.reviewed_at);
    const reviewsByDay = new Map<string, number>();
    for (const iso of reviewDates) {
      const key = dayKey(new Date(iso));
      reviewsByDay.set(key, (reviewsByDay.get(key) ?? 0) + 1);
    }

    const weekReviews = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        count: reviewsByDay.get(dayKey(d)) ?? 0,
      };
    });

    const { data: weakData } = await supabase
      .from('quiz_attempts')
      .select('score, quizzes(deck_id, decks(title))')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50);

    const topicMap = new Map<string, { title: string; scores: number[] }>();
    for (const row of (weakData ?? []) as unknown as Array<{
      score: number;
      quizzes: { deck_id: string | null; decks: { title: string } | null } | null;
    }>) {
      const deckId = row.quizzes?.deck_id;
      const title = row.quizzes?.decks?.title;
      if (!deckId || !title) continue;
      const entry = topicMap.get(deckId) ?? { title, scores: [] };
      entry.scores.push(row.score);
      topicMap.set(deckId, entry);
    }

    const weakTopics = Array.from(topicMap.entries())
      .map(([deck_id, { title, scores }]) => ({
        deck_id,
        deck_title: title,
        accuracy: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return {
      totalDecks: decks.length,
      totalFlashcards: cards.length,
      dueToday,
      dueDeckCount: dueDecks.length,
      matureCards,
      streak: computeStreak(reviewDates),
      reviewedToday: reviewsByDay.get(dayKey(now)) ?? 0,
      weekReviews,
      dueDecks,
      recentAttempts: attempts.data ?? [],
      weakTopics,
    };
  },
};
