'use client';

import { useCallback, useEffect, useState } from 'react';
import { Turnstile, turnstileEnabled } from '@/components/auth/Turnstile';

/**
 * Turnstile host page for the React Native app.
 *
 * Cloudflare validates a challenge against the domain serving it, so the mobile
 * app cannot render the widget from bundled local HTML — the origin would not
 * match the site key's allowlist. Instead the app loads this page in a WebView:
 * the origin is notestify.com, which is already allowlisted, and the resulting
 * token is handed back over the WebView bridge.
 *
 * Only the email/password path in the app loads this. Google sign-in needs no
 * captcha, so it stays available even if this page is unreachable.
 *
 * Messages posted to the app are JSON: { type: 'ready' | 'token' | 'expired' |
 * 'error', token?, reason? }.
 */

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

type OutboundMessage =
  | { type: 'ready' }
  | { type: 'token'; token: string }
  | { type: 'expired' }
  | { type: 'error'; reason: string };

const post = (message: OutboundMessage) => {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

export default function MobileCaptchaPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTheme(params.get('theme') === 'dark' ? 'dark' : 'light');

    if (!turnstileEnabled) {
      // Captcha is switched off for this environment; tell the app so it can
      // submit without a token rather than waiting forever for one.
      post({ type: 'error', reason: 'captcha-disabled' });
      return;
    }

    post({ type: 'ready' });
  }, []);

  // The app asks for a fresh challenge after a failed submit, because Turnstile
  // tokens are single-use and the next attempt would otherwise fail on the
  // captcha rather than on the real credentials.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data === 'reset') setResetKey((k) => k + 1);
    };
    // iOS delivers app -> page messages on window, Android on document.
    window.addEventListener('message', onMessage);
    document.addEventListener('message', onMessage as EventListener);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('message', onMessage as EventListener);
    };
  }, []);

  const handleVerify = useCallback((token: string) => {
    post({ type: 'token', token });
  }, []);

  const handleExpire = useCallback(() => {
    post({ type: 'expired' });
  }, []);

  return (
    <main className="flex min-h-[70px] items-center justify-center bg-transparent">
      <Turnstile
        onVerify={handleVerify}
        onExpire={handleExpire}
        resetKey={resetKey}
        themeOverride={theme}
      />
    </main>
  );
}
