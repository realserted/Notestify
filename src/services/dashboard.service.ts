import type { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardStats {
  totalDecks: number;
  totalFlashcards: number;
  dueToday: number;
  streak: number;
  recentAttempts: Array<{ id: string; quiz_id: string; score: number; completed_at: string }>;
  weakTopics: Array<{ deck_id: string; deck_title: string; accuracy: number }>;
}

const computeStreak = (reviewDates: string[]): number => {
  if (reviewDates.length === 0) return 0;

  const uniqueDays = new Set(reviewDates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (uniqueDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yKey = cursor.toISOString().slice(0, 10);
      if (!uniqueDays.has(yKey)) break;
    } else {
      break;
    }
  }
  return streak;
};

export const dashboardService = {
  getStats: async (supabase: SupabaseClient, userId: string): Promise<DashboardStats> => {
    const nowIso = new Date().toISOString();

    const [
      { count: totalDecks },
      { count: totalFlashcards },
      { count: dueToday },
      logs,
      attempts,
    ] = await Promise.all([
      supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('due_date', nowIso),
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

    const streak = computeStreak(
      (logs.data ?? []).map((l: { reviewed_at: string }) => l.reviewed_at)
    );

    const { data: weakData } = await supabase
      .from('quiz_attempts')
      .select('score, quizzes(deck_id, decks(title))')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(50);

    const topicMap = new Map<string, { title: string; scores: number[] }>();
    for (const row of (weakData ?? []) as Array<{
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
      totalDecks: totalDecks ?? 0,
      totalFlashcards: totalFlashcards ?? 0,
      dueToday: dueToday ?? 0,
      streak,
      recentAttempts: attempts.data ?? [],
      weakTopics,
    };
  },
};
