import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Verifying',
  // This page only ever renders inside the mobile app's WebView. It is not a
  // destination for humans or crawlers.
  robots: { index: false, follow: false },
};

export default function MobileCaptchaLayout({ children }: { children: ReactNode }) {
  return children;
}
