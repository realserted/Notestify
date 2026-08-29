import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deckService } from '@/services/deck.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreateDeckButton } from '@/components/flashcards/CreateDeckButton';

export default async function DecksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const decks = await deckService.listWithProgress(supabase, user.id);
  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-extrabold tracking-[-0.035em] sm:text-4xl">
            My Decks
          </h1>
          {decks.length > 0 && (
            <p className="mt-1 text-[12.5px] font-bold uppercase tracking-[0.08em] text-bark-500 dark:text-bark-300">
              {decks.length} {decks.length === 1 ? 'deck' : 'decks'} · {totalCards} cards
            </p>
          )}
        </div>
        <CreateDeckButton />
      </div>

      {decks.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-bark-500 dark:text-bark-300">
            No decks yet. Create one to get started.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const maturePct =
              deck.cardCount > 0 ? Math.round((deck.matureCount / deck.cardCount) * 100) : 0;
            return (
              <div
                key={deck.id}
                className="flex overflow-hidden rounded-pop border-2 border-espresso-700 bg-paper-50 shadow-pop dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark"
              >
                {/* Spine reads at a glance: citrus if anything is due. */}
                <span
                  className={`w-[5px] shrink-0 ${
                    deck.dueCount > 0 ? 'bg-citrus-500' : 'bg-paper-300 dark:bg-night-600'
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 p-5">
                  <h3 className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">
                    {deck.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500 dark:text-bark-300">
                    {deck.cardCount} cards
                    {deck.dueCount > 0 && ` · ${deck.dueCount} due`}
                  </p>
                  <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-paper-200 dark:bg-night-700">
                    <div className="h-full bg-citrus-500" style={{ width: `${maturePct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-bark-500 dark:text-bark-300">
                      {maturePct}% mature
                    </span>
                    <Link href={`/decks/${deck.id}`}>
                      <Button size="sm" variant={deck.dueCount > 0 ? 'primary' : 'outline'}>
                        Open
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
