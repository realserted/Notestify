'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotestifyLogo } from '@/components/brand/NotestifyLogo';

export const DashboardShell = ({
  children,
  streak = 0,
  dueCount = 0,
}: {
  children: React.ReactNode;
  streak?: number;
  dueCount?: number;
}) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper-100 dark:bg-night-900 md:flex-row">
      <header className="flex h-14 items-center justify-between border-b-2 border-espresso-700 bg-paper-50 px-4 dark:border-night-600 dark:bg-night-800 md:hidden">
        <NotestifyLogo size={26} />
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

      {/* Drawer on mobile; on desktop it sticks to the viewport so the nav and
          the utilities below it stay reachable however long the page gets. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:sticky md:top-0 md:bottom-auto md:flex md:h-[100dvh] md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={close} streak={streak} dueCount={dueCount} />
      </div>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
};
