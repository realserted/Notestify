'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GoogleButton } from '@/components/auth/GoogleButton';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-2 font-serif text-3xl tracking-tight text-ink-900 dark:text-cream-50">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-ink-500 dark:text-cream-50/60">
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
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-ink-500 dark:text-cream-50/50">
          <span className="h-px flex-1 bg-cream-200 dark:bg-ink-700" />
          or
          <span className="h-px flex-1 bg-cream-200 dark:bg-ink-700" />
        </div>
        <GoogleButton onError={setError} />
        <p className="mt-6 text-center text-sm text-ink-500 dark:text-cream-50/70">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-coral-500 hover:text-coral-600 hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
