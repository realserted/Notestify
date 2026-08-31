'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Bug, Lightbulb, MessageCircle, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

type Kind = 'bug' | 'idea' | 'other';

const KINDS: Array<{ id: Kind; label: string; Icon: typeof Bug; hint: string }> = [
  { id: 'bug', label: 'Bug', Icon: Bug, hint: 'What went wrong, and what were you doing?' },
  { id: 'idea', label: 'Idea', Icon: Lightbulb, hint: 'What would you like Notestify to do?' },
  { id: 'other', label: 'Other', Icon: MessageCircle, hint: 'Anything else on your mind?' },
];

/**
 * Opened from the sidebar. A dialog rather than a page so the user stays on
 * the screen they are reporting about — which is also what makes the captured
 * route meaningful.
 */
export const FeedbackDialog = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    // Reset after the dialog is gone so the content does not flicker.
    setTimeout(() => {
      setMessage('');
      setError('');
      setSent(false);
      setKind('bug');
    }, 150);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        message,
        path: pathname,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      }),
    });
    setSending(false);

    if (!res.ok) {
      const { error: msg } = await res
        .json()
        .catch(() => ({ error: 'Could not send that. Please try again.' }));
      return setError(typeof msg === 'string' ? msg : 'Could not send that. Please try again.');
    }

    setSent(true);
  };

  const active = KINDS.find((k) => k.id === kind)!;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-3 rounded-pop px-3.5 py-2.5 text-sm font-semibold transition-colors',
          'text-bark-700 hover:bg-paper-200 dark:text-foam-50 dark:hover:bg-night-700',
          className,
        )}
      >
        <MessageSquarePlus size={18} />
        Feedback
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
            <button
              type="button"
              aria-label="Close feedback"
              onClick={close}
              className="absolute inset-0 bg-espresso-900/50"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Send feedback"
              className="relative w-full max-w-[440px] rounded-pop-lg border-2 border-espresso-700 bg-paper-50 p-6 shadow-pop-lg dark:border-night-600 dark:bg-night-800 dark:shadow-pop-dark"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  {sent ? 'Thanks — got it' : 'Send feedback'}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mr-1 -mt-1 rounded-full p-1.5 text-bark-500 hover:bg-paper-200 dark:text-bark-300 dark:hover:bg-night-700"
                >
                  <X size={18} />
                </button>
              </div>

              {sent ? (
                <div className="mt-3 space-y-5">
                  <p className="text-sm text-bark-700 dark:text-foam-50/75">
                    This goes straight to the person who builds Notestify. If it was a bug, the page
                    you were on was included automatically.
                  </p>
                  <Button onClick={close} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {KINDS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setKind(id)}
                        aria-pressed={kind === id}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-pop border-2 py-3 text-[13px] font-bold transition-colors',
                          kind === id
                            ? 'border-espresso-700 bg-citrus-500 text-espresso-700 shadow-pop-sm dark:border-espresso-900'
                            : 'border-paper-300 text-bark-700 hover:bg-paper-200 dark:border-night-600 dark:text-foam-50 dark:hover:bg-night-700',
                        )}
                      >
                        <Icon size={17} />
                        {label}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    ref={textareaRef}
                    id="feedback-message"
                    label={active.hint}
                    rows={5}
                    maxLength={4000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      kind === 'bug'
                        ? 'I clicked Extract on a PDF and nothing happened…'
                        : 'It would help if…'
                    }
                  />

                  {error && (
                    <p className="text-sm font-semibold text-clay-500 dark:text-clay-300">
                      {error}
                    </p>
                  )}

                  <p className="text-[12px] text-bark-500 dark:text-bark-300">
                    Sent with the page you&apos;re on and your browser version, to help reproduce
                    issues. Nothing from your notes or documents is included.
                  </p>

                  <Button
                    type="submit"
                    className="w-full"
                    loading={sending}
                    disabled={!message.trim()}
                  >
                    Send
                  </Button>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
