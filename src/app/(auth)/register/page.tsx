'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Turnstile, turnstileEnabled } from '@/components/auth/Turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Those passwords do not match.');
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        ...(captchaToken ? { captchaToken } : {}),
      },
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
      <h1 className="font-display text-[34px] font-extrabold tracking-[-0.03em]">
        Create your account
      </h1>
      <p className="mb-8 mt-1.5 text-sm text-bark-500 dark:text-bark-300">
        Study smarter in just a few seconds.
      </p>
      <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            error={
              confirmPassword && password !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
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
          disabled={
            (turnstileEnabled && !captchaToken) ||
            !password ||
            password !== confirmPassword
          }
        >
          Create account
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-bark-500 dark:text-bark-300">
        <span className="h-0.5 flex-1 bg-paper-300 dark:bg-night-600" />
        or
        <span className="h-0.5 flex-1 bg-paper-300 dark:bg-night-600" />
      </div>
      <GoogleButton onError={setError} />
      <p className="mt-7 text-center text-sm text-bark-500 dark:text-bark-300">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold text-citrus-600 underline decoration-2 underline-offset-2 dark:text-citrus-500"
        >
          Sign in
        </Link>
      </p>
    </AuthSplit>
  );
}
