'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper-100 dark:bg-night-900 md:flex-row">
      <header className="flex h-14 items-center justify-between border-b-2 border-espresso-700 bg-paper-50 px-4 dark:border-night-600 dark:bg-night-800 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="h-3.5 w-3.5 rounded-[5px] border-2 border-espresso-700 bg-citrus-500 dark:border-espresso-900" />
          <h1 className="font-display text-lg font-bold tracking-tight">Notestify</h1>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-bark-700 transition-colors hover:bg-paper-200 dark:text-foam-50 dark:hover:bg-night-700"
        >
          <Menu size={22} />
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="fixed inset-0 z-40 bg-espresso-900/50 md:hidden"
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
