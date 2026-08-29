'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * Cloudflare Turnstile widget.
 *
 * The site key is public by design. The matching secret lives in the Supabase
 * dashboard, not in this app — Supabase verifies the token server-side when
 * signUp/signInWithPassword is called.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so the app
 * keeps working before Cloudflare and Supabase are configured.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Whether a captcha token is required before a form may be submitted. */
export const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark';
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
    }
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

const loadTurnstile = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Turnstile'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

interface Props {
  onVerify: (token: string) => void;
  /** Called when the token expires or the challenge errors, so the form re-locks. */
  onExpire?: () => void;
  /**
   * Bump to force a fresh challenge. Tokens are single-use, so a failed
   * submit must reset the widget or the next attempt is rejected by the
   * captcha rather than by the real credentials.
   */
  resetKey?: number;
}

export const Turnstile = ({ onVerify, onExpire, resetKey = 0 }: Props) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Kept in refs so re-renders never re-create the widget.
  const verifyRef = useRef(onVerify);
  const expireRef = useRef(onExpire);

  verifyRef.current = onVerify;
  expireRef.current = onExpire;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return;

    let cancelled = false;
    const el = containerRef.current;

    void loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: theme === 'dark' ? 'dark' : 'light',
          callback: (token) => verifyRef.current(token),
          'error-callback': () => expireRef.current?.(),
          'expired-callback': () => expireRef.current?.(),
        });
      })
      .catch((err) => {
        console.error('[turnstile]', err);
        // Leave the form locked rather than silently letting bots through.
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // Re-rendered on theme change: Turnstile bakes the theme in at render time.
  }, [theme]);

  useEffect(() => {
    if (resetKey === 0 || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    expireRef.current?.();
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className="flex justify-center" />;
};
