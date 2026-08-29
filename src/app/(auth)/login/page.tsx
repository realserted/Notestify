'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Turnstile, turnstileEnabled } from '@/components/auth/Turnstile';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  // /auth/callback redirects here with ?error= when the OAuth exchange fails.
  useEffect(() => {
    const callbackError = new URLSearchParams(window.location.search).get('error');
    if (callbackError) {
      setError(callbackError);
      window.history.replaceState(null, '', '/login');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      // The token was consumed by that attempt; force a fresh challenge.
      setCaptchaToken(null);
      setCaptchaAttempt((n) => n + 1);
      return setError(error.message);
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <AuthSplit>
      <h1 className="font-display text-[34px] font-extrabold tracking-[-0.03em]">Welcome back</h1>
      <p className="mb-8 mt-1.5 text-sm text-bark-500 dark:text-bark-300">
        Pick up where you left off.
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        {error && (
          <p className="text-sm font-semibold text-clay-500 dark:text-clay-300">{error}</p>
        )}
        <Turnstile
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          resetKey={captchaAttempt}
        />
        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={turnstileEnabled && !captchaToken}
        >
          Sign in
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-bark-500 dark:text-bark-300">
        <span className="h-0.5 flex-1 bg-paper-300 dark:bg-night-600" />
        or
        <span className="h-0.5 flex-1 bg-paper-300 dark:bg-night-600" />
      </div>
      <GoogleButton onError={setError} />
      <p className="mt-7 text-center text-sm text-bark-500 dark:text-bark-300">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-bold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
        >
          Register
        </Link>
      </p>
    </AuthSplit>
  );
}
