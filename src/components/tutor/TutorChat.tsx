'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquarePlus, Trash2, History, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Markdown } from '@/components/ui/Markdown';
import { ContextPicker, type TutorContext } from './ContextPicker';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  context_label: string | null;
}

const relativeDay = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
};

export const TutorChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [context, setContext] = useState<TutorContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/ai/tutor/conversations');
    if (res.ok) setConversations((await res.json()).conversations);
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (id: string) => {
    setHistoryOpen(false);
    const res = await fetch(`/api/ai/tutor/conversations/${id}`);
    if (!res.ok) return;
    const { messages: history, conversation } = await res.json();
    setMessages(history);
    setConversationId(id);
    setContext(
      conversation?.context_label
        ? { type: conversation.context_type, id: '', label: conversation.context_label }
        : null
    );
  };

  const startNew = () => {
    setMessages([]);
    setConversationId(null);
    setContext(null);
    setHistoryOpen(false);
  };

  const deleteConversation = async (id: string) => {
    const res = await fetch(`/api/ai/tutor/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) startNew();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/ai/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage.content,
        conversation_id: conversationId,
        ...(conversationId || !context
          ? {}
          : { context_type: context.type, context_id: context.id }),
      }),
    });
    setLoading(false);

    if (res.ok) {
      const { reply, conversation_id } = await res.json();
      setConversationId(conversation_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      void loadConversations();
    } else {
      // 429 and 422 carry a message written for the student; show it as-is
      // rather than prefixing it like a crash.
      const { error } = await res
        .json()
        .catch(() => ({ error: 'Something went wrong. Please try again.' }));
      const text = typeof error === 'string' ? error : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    }
  };

  const historyList = (
    <>
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500 dark:text-bark-300">
          Past sessions
        </p>
        <button
          type="button"
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
          className="text-bark-700 dark:text-foam-50 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <Button variant="outline" size="sm" className="w-full gap-2" onClick={startNew}>
        <MessageSquarePlus size={15} />
        New session
      </Button>

      {conversations.length === 0 ? (
        <p className="mt-4 px-1 text-[13px] text-bark-500 dark:text-bark-300">
          No past sessions yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => openConversation(c.id)}
                className={`w-full rounded-pop border-2 px-3 py-2 pr-9 text-left transition-colors ${
                  c.id === conversationId
                    ? 'border-espresso-700 bg-espresso-500 text-paper-50 shadow-pop-sm dark:border-espresso-900 dark:bg-citrus-500 dark:text-espresso-900'
                    : 'border-transparent hover:bg-paper-200 dark:hover:bg-night-700'
                }`}
              >
                <span className="block truncate text-[13.5px] font-semibold">{c.title}</span>
                {c.context_label && (
                  <span className="mt-0.5 block truncate text-[11px] font-semibold opacity-80">
                    {c.context_label}
                  </span>
                )}
                <span
                  className={`block text-[11px] font-semibold ${
                    c.id === conversationId
                      ? 'text-paper-200 dark:text-espresso-700'
                      : 'text-bark-500 dark:text-bark-300'
                  }`}
                >
                  {relativeDay(c.updated_at)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteConversation(c.id)}
                aria-label={`Delete ${c.title}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-bark-500 opacity-0 transition-opacity hover:text-clay-500 focus:opacity-100 group-hover:opacity-100 dark:text-bark-300"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col md:h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[30px] font-extrabold tracking-[-0.03em]">AI Tutor</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 lg:hidden"
          onClick={() => setHistoryOpen(true)}
        >
          <History size={15} />
          History
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="hidden w-64 shrink-0 flex-col lg:flex">{historyList}</aside>

        {historyOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              aria-label="Close history"
              className="absolute inset-0 bg-espresso-900/50"
              onClick={() => setHistoryOpen(false)}
            />
            <div className="relative flex w-72 flex-col overflow-y-auto border-r-2 border-espresso-700 bg-paper-50 p-4 dark:border-night-600 dark:bg-night-800">
              {historyList}
            </div>
          </div>
        )}

        <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
          <div
            ref={scrollRef}
            className="flex-1 space-y-6 overflow-y-auto px-6 py-[26px] sm:px-[30px]"
          >
            {messages.length === 0 ? (
              <p className="text-center text-bark-500 dark:text-bark-300">
                Ask me anything you&apos;re studying…
              </p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[76px_1fr] sm:gap-[18px]">
                  <p
                    className={`pt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] sm:text-right ${
                      m.role === 'user'
                        ? 'text-bark-500 dark:text-bark-300'
                        : 'text-citrus-600 dark:text-citrus-500'
                    }`}
                  >
                    {m.role === 'user' ? 'You' : 'Tutor'}
                  </p>
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap border-l-2 border-espresso-500 bg-paper-200 px-4 py-3 text-[14.5px] leading-[1.65] dark:border-citrus-500 dark:bg-night-700">
                      {m.content}
                    </p>
                  ) : (
                    <Markdown
                      content={m.content}
                      className="max-w-[660px] text-[14.5px] leading-[1.7] text-bark-700 dark:text-foam-50/80"
                    />
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="grid gap-3 sm:grid-cols-[76px_1fr] sm:gap-[18px]">
                <p className="pt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-citrus-600 dark:text-citrus-500 sm:text-right">
                  Tutor
                </p>
                <p className="text-[14.5px] italic leading-[1.7] text-bark-500 dark:text-bark-300">
                  Thinking…
                </p>
              </div>
            )}
          </div>

          {(context || !conversationId) && (
            <div className="flex flex-wrap items-center gap-2 border-t-2 border-espresso-700 px-5 py-3 dark:border-night-600">
              {conversationId ? (
                context && (
                  <span className="rounded-full border-2 border-espresso-700 bg-citrus-500 px-3.5 py-1.5 text-[13px] font-bold text-espresso-700 dark:border-espresso-900">
                    Studying: {context.label}
                  </span>
                )
              ) : (
                <ContextPicker value={context} onChange={setContext} />
              )}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="flex items-center gap-3.5 border-t-2 border-espresso-700 px-5 py-3.5 dark:border-night-600"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-bark-500/70 dark:placeholder:text-bark-300/60 sm:text-sm"
              disabled={loading}
            />
            <Button type="submit" loading={loading}>
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
