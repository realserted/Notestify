import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

export const metadata: Metadata = {
  title: 'Notestify — AI-powered study companion',
  description: 'Flashcards, quizzes, and AI-generated study materials.',
};

const themeInitScript = `
(function(){try{var t=localStorage.getItem('notestify-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-cream-50 text-ink-900 antialiased dark:bg-ink-900 dark:text-cream-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}