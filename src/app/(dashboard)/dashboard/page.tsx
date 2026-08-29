import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { dashboardService } from '@/services/dashboard.service';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const GOAL_SEGMENTS = 15;
/** Rough pace used to turn a due count into a time estimate. */
const CARDS_PER_MINUTE = 3;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stats = await dashboardService.getStats(supabase, user.id);

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0];
  const minutes = Math.max(1, Math.round(stats.dueToday / CARDS_PER_MINUTE));
  const maturePct =
    stats.totalFlashcards > 0 ? Math.round((stats.matureCards / stats.totalFlashcards) * 100) : 0;
  const quizAverage =
    stats.recentAttempts.length > 0
      ? Math.round(
          stats.recentAttempts.reduce((sum, a) => sum + a.score, 0) / stats.recentAttempts.length
        )
      : null;

  // Today's goal is the cards that were due at the start of the session.
  const goalTotal = stats.reviewedToday + stats.dueToday;
  const goalFilled =
    goalTotal > 0 ? Math.round((stats.reviewedToday / goalTotal) * GOAL_SEGMENTS) : 0;

  const busiestDay = Math.max(...stats.weekReviews.map((d) => d.count), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[32px] font-extrabold tracking-[-0.035em] sm:text-4xl">
          {firstName ? `Hey, ${firstName}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-[15px] text-bark-700 dark:text-foam-50/70">
          {stats.dueToday > 0 ? (
            <>
              You&apos;ve got{' '}
              <span className="font-bold text-espresso-700 dark:text-foam-50">
                {stats.dueToday} cards
              </span>{' '}
              due today. That&apos;s about {minutes} minutes.
            </>
          ) : (
            'Nothing due today. Nice work.'
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[18px] border-2 border-espresso-700 bg-citrus-500 p-5 shadow-pop dark:border-espresso-900 dark:shadow-pop-dark">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-espresso-700">
            Due today
          </p>
          <p className="mt-2 font-display text-[52px] font-extrabold leading-none text-espresso-700">
            {stats.dueToday}
          </p>
          <p className="mt-1.5 text-[13px] font-semibold text-espresso-700/70">
            across {stats.dueDeckCount} {stats.dueDeckCount === 1 ? 'deck' : 'decks'}
          </p>
        </div>

        <div className="rounded-[18px] border-2 border-espresso-700 bg-paper-50 p-5 shadow-pop dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-bark-500 dark:text-bark-300">
            Cards in play
          </p>
          <p className="mt-2 font-display text-[52px] font-extrabold leading-none">
            {stats.totalFlashcards}
          </p>
          <p className="mt-1.5 text-[13px] font-semibold text-bark-500 dark:text-bark-300">
            {maturePct}% mature
          </p>
        </div>

        <div className="rounded-[18px] border-2 border-espresso-700 bg-espresso-500 p-5 shadow-pop dark:border-night-600 dark:bg-night-700 dark:shadow-pop-dark">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-paper-200">
            Quiz average
          </p>
          <p className="mt-2 font-display text-[52px] font-extrabold leading-none text-paper-50">
            {quizAverage === null ? '—' : `${quizAverage}%`}
          </p>
          <p className="mt-1.5 text-[13px] font-semibold text-citrus-500">
            {quizAverage === null
              ? 'No quizzes yet'
              : `across ${stats.recentAttempts.length} recent ${
                  stats.recentAttempts.length === 1 ? 'attempt' : 'attempts'
                }`}
          </p>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-[19px]">Today&apos;s goal</CardTitle>
          <p className="text-[13.5px] font-bold text-bark-700 dark:text-foam-50/80">
            {stats.reviewedToday} of {goalTotal} cards
          </p>
        </div>
        <div className="mt-3.5 flex gap-[5px]" aria-hidden>
          {Array.from({ length: GOAL_SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={`h-4 flex-1 rounded-md border-2 border-espresso-700 dark:border-night-600 ${
                i < goalFilled ? 'bg-espresso-500 dark:bg-citrus-500' : 'bg-paper-200 dark:bg-night-700'
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-[13px] text-bark-500 dark:text-bark-300">
          {stats.dueToday > 0
            ? `${stats.dueToday} to go — finish and your streak hits ${stats.streak + 1} days.`
            : 'All cleared for today.'}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <CardTitle className="text-[19px]">Jump back in</CardTitle>
          {stats.dueDecks.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-bark-500 dark:text-bark-300">Nothing due right now.</p>
              <Link href="/decks">
                <Button size="sm">Browse decks</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-3.5 flex flex-col gap-2.5">
              {stats.dueDecks.slice(0, 3).map((deck, i) => (
                <div
                  key={deck.id}
                  className="flex items-center gap-3.5 rounded-[14px] border-2 border-espresso-700 p-3 dark:border-night-600"
                >
                  <span
                    className={`h-[34px] w-[34px] shrink-0 rounded-[10px] border-2 border-espresso-700 dark:border-espresso-900 ${
                      ['bg-citrus-500', 'bg-caramel-500', 'bg-citrus-300'][i] ?? 'bg-citrus-500'
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold">{deck.title}</p>
                    <p className="mt-0.5 text-[12.5px] font-semibold text-bark-500 dark:text-bark-300">
                      {deck.due} due · {deck.total} cards
                    </p>
                  </div>
                  <Link href={`/decks/${deck.id}/study`} className="shrink-0">
                    <Button size="sm">Study</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <CardTitle className="text-[19px]">This week</CardTitle>
          <div className="mt-4 flex h-[104px] items-end gap-2.5" aria-hidden>
            {stats.weekReviews.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`w-full rounded-lg border-2 border-espresso-700 dark:border-espresso-900 ${
                    d.count === busiestDay && d.count > 0
                      ? 'bg-citrus-500'
                      : 'bg-espresso-500 dark:bg-night-700'
                  }`}
                  style={{ height: `${Math.max(6, (d.count / busiestDay) * 78)}px` }}
                />
                <span className="text-[11px] font-bold text-bark-500 dark:text-bark-300">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-auto pt-4 text-[13px] text-bark-500 dark:text-bark-300">
            {stats.weekReviews.reduce((sum, d) => sum + d.count, 0)} reviews in the last 7 days.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="text-[19px]">Recent quiz attempts</CardTitle>
          {stats.recentAttempts.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-bark-500 dark:text-bark-300">No attempts yet.</p>
              <Link href="/quizzes">
                <Button size="sm">Take a quiz</Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-3.5 space-y-0">
              {stats.recentAttempts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between border-b-2 border-paper-200 py-2.5 text-sm last:border-0 dark:border-night-700"
                >
                  <span className="font-semibold text-bark-700 dark:text-foam-50/80">
                    {new Date(a.completed_at).toLocaleDateString()}
                  </span>
                  <span className="font-bold">{a.score}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <CardTitle className="text-[19px]">Weak topics</CardTitle>
          {stats.weakTopics.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-bark-500 dark:text-bark-300">
                Take a quiz to see insights.
              </p>
              <Link href="/quizzes">
                <Button size="sm">Take a quiz</Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-3.5 space-y-3">
              {stats.weakTopics.map((t) => (
                <li key={t.deck_id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-bark-700 dark:text-foam-50/80">
                      {t.deck_title}
                    </span>
                    <span className="font-bold text-clay-500 dark:text-clay-300">{t.accuracy}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-200 dark:bg-night-700">
                    <div className="h-full bg-clay-500" style={{ width: `${t.accuracy}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
