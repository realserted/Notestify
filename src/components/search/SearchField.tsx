'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export const SearchField = ({ initialQuery }: { initialQuery: string }) => {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <form onSubmit={submit} className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bark-500 dark:text-bark-300"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search decks, cards, notes, documents…"
        aria-label="Search your content"
        className="w-full rounded-pop border-2 border-espresso-700 bg-paper-50 py-3 pl-11 pr-4 text-base outline-none transition-shadow placeholder:text-bark-500/70 focus:shadow-pop-sm dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:placeholder:text-bark-300/60 dark:focus:shadow-pop-dark sm:text-sm"
      />
    </form>
  );
};
