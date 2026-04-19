import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deckService } from '@/services/deck.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreateDeckButton } from '@/components/flashcards/CreateDeckButton';

interface DeckRow {
  id: string;
  title: string;
  description: string | null;
  flashcards: { count: number }[];
}

export default async function DecksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const decks = (await deckService.list(supabase, user.id)) as DeckRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Decks</h1>
        <CreateDeckButton />
      </div>

      {decks.length === 0 ? (
        <Card>
          <p className="text-ink-500 dark:text-ink-500">No decks yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id}>
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
              </CardHeader>
              <p className="mb-4 line-clamp-2 text-sm text-ink-500 dark:text-ink-500">
                {deck.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-500">{deck.flashcards[0]?.count ?? 0} cards</span>
                <Link href={`/decks/${deck.id}`}>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
