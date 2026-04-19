import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deckService } from '@/services/deck.service';
import { flashcardService } from '@/services/flashcard.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DeckActions } from '@/components/flashcards/DeckActions';

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [deck, cards] = await Promise.all([
    deckService.get(supabase, id),
    flashcardService.listByDeck(supabase, id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deck.title}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{deck.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/decks/${deck.id}/study`}>
            <Button>Study</Button>
          </Link>
          <DeckActions deckId={deck.id} />
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Flashcards ({cards.length})</h2>
        {cards.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No flashcards yet. Add some or generate with AI.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cards.map((card) => (
              <li key={card.id} className="py-3">
                <p className="font-medium">{card.front}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{card.back}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
