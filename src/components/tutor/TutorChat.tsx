'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TutorChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
      body: JSON.stringify({ message: userMessage.content, conversation_id: conversationId }),
    });
    setLoading(false);

    if (res.ok) {
      const { reply, conversation_id } = await res.json();
      setConversationId(conversation_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col md:h-[calc(100vh-7rem)]">
      <h1 className="mb-4 font-display text-[30px] font-extrabold tracking-[-0.03em]">AI Tutor</h1>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-[26px] sm:px-[30px]">
          {messages.length === 0 ? (
            <p className="text-center text-bark-500 dark:text-bark-300">
              Ask me anything you&apos;re studying…
            </p>
          ) : (
            messages.map((m, i) => (
              // Gutter label instead of chat bubbles — long answers read better
              // as plain text than inside a container.
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
                  <p className="max-w-[660px] whitespace-pre-wrap text-[14.5px] leading-[1.7] text-bark-700 dark:text-foam-50/80">
                    {m.content}
                  </p>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="grid gap-3 sm:grid-cols-[76px_1fr] sm:gap-[18px]">
              <p className="pt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-citrus-600 sm:text-right dark:text-citrus-500">
                Tutor
              </p>
              <p className="text-[14.5px] italic leading-[1.7] text-bark-500 dark:text-bark-300">
                Thinking…
              </p>
            </div>
          )}
        </div>

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
  );
};
