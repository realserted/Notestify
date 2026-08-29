import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

// Replaces Fraunces. Bricolage is the display face; Plus Jakarta Sans is body + UI.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Notestify — AI-powered study companion',
  description: 'Flashcards, quizzes, and AI-generated study materials.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7E9D6' },
    { media: '(prefers-color-scheme: dark)', color: '#1A0F08' },
  ],
};

const themeInitScript = `
(function(){try{var t=localStorage.getItem('notestify-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}var a=localStorage.getItem('notestify-accent')||'default';document.documentElement.setAttribute('data-bg',a);}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-paper-100 font-sans text-espresso-700 antialiased dark:bg-night-900 dark:text-foam-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
