'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <header className="flex h-14 items-center justify-between border-b border-cream-200 bg-cream-50/95 px-4 backdrop-blur dark:border-ink-700 dark:bg-ink-900/95 md:hidden">
        <h1 className="font-serif text-lg tracking-tight">Notestify</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40"
        >
          <Menu size={22} />
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={close} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
};
