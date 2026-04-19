'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { cn } from '@/utils/cn';

const TOUR_STORAGE_KEY = 'notestify-tour-complete';

const startTour = (onFinish?: () => void) => {
  const instance = driver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Start studying',
    popoverClass: 'notestify-tour',
    onDestroyed: () => {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
      onFinish?.();
    },
    steps: [
      {
        popover: {
          title: 'Welcome to Notestify',
          description:
            "Let's take a quick tour so you know where everything lives. You can replay this any time from the Tutorial button in the sidebar.",
        },
      },
      {
        element: '[data-tour="dashboard"]',
        popover: {
          title: 'Dashboard',
          description:
            'Your study streak, due cards, total decks, recent quiz attempts, and weak topics — all at a glance.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="decks"]',
        popover: {
          title: 'Decks & Flashcards',
          description:
            'Build decks from scratch or generate them from your notes with AI. Review with the SM-2 spaced repetition algorithm so you remember more with less effort.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="quizzes"]',
        popover: {
          title: 'Quizzes',
          description:
            'Auto-graded multiple choice, true/false, and short answer quizzes. Generate them from any deck or document.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="uploads"]',
        popover: {
          title: 'Uploads',
          description:
            'Drop a PDF, DOCX, or PPTX. Notestify extracts the text so you can turn it into flashcards, quizzes, or a quick AI summary.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="tutor"]',
        popover: {
          title: 'AI Tutor',
          description:
            "Stuck on something? Chat with a patient AI tutor that knows your study material. No question is too small.",
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="theme"]',
        popover: {
          title: 'Light & Dark',
          description: 'Toggle between light and dark whenever your eyes need a break.',
          side: 'right',
          align: 'start',
        },
      },
      {
        popover: {
          title: "You're all set",
          description:
            'Start by uploading a document or creating your first deck. Happy studying!',
        },
      },
    ],
  });
  instance.drive();
};

interface TutorialButtonProps {
  className?: string;
}

export const TutorialButton = ({ className }: TutorialButtonProps) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/dashboard') return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const id = window.setTimeout(() => startTour(), 400);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const handleClick = () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
      window.setTimeout(() => startTour(), 500);
    } else {
      startTour();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'text-ink-700 hover:bg-cream-100',
        'dark:text-cream-50 dark:hover:bg-ink-700/40',
        className
      )}
    >
      <HelpCircle size={18} />
      Tutorial
    </button>
  );
};
