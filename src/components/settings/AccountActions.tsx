'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, TriangleAlert } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const AccountActions = ({ email }: { email: string }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_email: confirmEmail }),
    });

    if (!res.ok) {
      const { error: message } = await res
        .json()
        .catch(() => ({ error: 'Something went wrong.' }));
      setDeleting(false);
      setError(typeof message === 'string' ? message : 'Something went wrong.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <>
      <Card className="p-6">
        <CardTitle className="text-[19px]">Export your data</CardTitle>
        <p className="mt-2 text-sm text-bark-700 dark:text-foam-50/75">
          Download everything in your account as a single JSON file — notes, decks, flashcards,
          review history, quizzes, documents and tutor conversations. Uploaded files themselves
          are not included, only the records that point to them.
        </p>
        <a href="/api/account/export" download className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Download export
          </Button>
        </a>
      </Card>

      <Card className="border-clay-500 p-6 dark:border-clay-300">
        <CardTitle className="text-[19px] text-clay-500 dark:text-clay-300">
          Delete your account
        </CardTitle>
        <p className="mt-2 text-sm text-bark-700 dark:text-foam-50/75">
          This removes your account and everything in it — every note, deck, card, quiz, uploaded
          file and tutor conversation. It happens immediately and cannot be undone. Export your
          data first if you might want it.
        </p>

        {!confirming ? (
          <Button variant="danger" className="mt-4" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        ) : (
          <div className="mt-5 space-y-4 rounded-pop border-2 border-clay-500 p-4 dark:border-clay-300">
            <p className="flex items-start gap-2.5 text-sm font-semibold text-clay-500 dark:text-clay-300">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              Type <span className="font-bold">{email}</span> to confirm.
            </p>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={email}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm font-semibold text-clay-500 dark:text-clay-300">{error}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="danger"
                loading={deleting}
                disabled={confirmEmail.trim().toLowerCase() !== email.toLowerCase()}
                onClick={handleDelete}
              >
                Permanently delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                  setConfirmEmail('');
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};
