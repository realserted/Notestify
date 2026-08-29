import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, FileText, NotebookPen, Layers, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { SearchField } from '@/components/search/SearchField';

interface Hit {
  kind: 'deck' | 'note' | 'document' | 'flashcard' | 'quiz';
  id: string;
  title: string;
  snippet: string;
  parent_id: string | null;
}

const KIND_META = {
  deck: { label: 'Deck', Icon: Layers, dot: 'bg-citrus-500' },
  flashcard: { label: 'Card', Icon: BookOpen, dot: 'bg-citrus-300' },
  note: { label: 'Note', Icon: NotebookPen, dot: 'bg-clay-500' },
  document: { label: 'Document', Icon: FileText, dot: 'bg-olive-300' },
  quiz: { label: 'Quiz', Icon: HelpCircle, dot: 'bg-caramel-500' },
} as const;

const hrefFor = (hit: Hit): string => {
  switch (hit.kind) {
    case 'deck':
      return `/decks/${hit.id}`;
    case 'flashcard':
      return `/decks/${hit.parent_id}`;
    case 'note':
      return `/notes/${hit.parent_id}/${hit.id}`;
    case 'document':
      return `/documents/${hit.id}`;
    case 'quiz':
      return `/quizzes/${hit.id}`;
  }
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { q } = await searchParams;
  const query = (q ?? '').trim();

  let hits: Hit[] = [];
  if (query.length >= 2) {
    const { data, error } = await supabase.rpc('search_all', { p_query: query });
    if (error) console.error('[search]', error);
    hits = (data ?? []) as Hit[];
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <h1 className="font-display text-[32px] font-extrabold tracking-[-0.035em] sm:text-4xl">
        Search
      </h1>

      <SearchField initialQuery={query} />

      {query.length < 2 ? (
        <p className="text-sm text-bark-500 dark:text-bark-300">
          Search across your decks, cards, notes, documents and quizzes. Type at least two
          characters.
        </p>
      ) : hits.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-bark-500 dark:text-bark-300">
            Nothing matched &ldquo;{query}&rdquo;.
          </p>
        </Card>
      ) : (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500 dark:text-bark-300">
            {hits.length} {hits.length === 1 ? 'result' : 'results'}
            {hits.length === 50 && ' (showing the first 50)'}
          </p>
          <ul className="space-y-2.5">
            {hits.map((hit) => {
              const { label, Icon, dot } = KIND_META[hit.kind];
              return (
                <li key={`${hit.kind}-${hit.id}`}>
                  <Link
                    href={hrefFor(hit)}
                    className="flex items-start gap-3.5 rounded-pop border-2 border-espresso-700 bg-paper-50 p-4 shadow-pop transition-all duration-100 hover:bg-paper-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark dark:hover:bg-night-700"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-2 border-espresso-700 dark:border-espresso-900 ${dot}`}
                      aria-hidden
                    >
                      <Icon size={15} className="text-espresso-700" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-bark-500 dark:text-bark-300">
                        {label}
                      </span>
                      <span className="mt-0.5 block truncate font-bold">{hit.title}</span>
                      {hit.snippet && (
                        <span className="mt-1 block line-clamp-2 text-[13px] text-bark-700 dark:text-foam-50/70">
                          {hit.snippet}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
