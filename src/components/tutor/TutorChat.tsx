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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error}` },
      ]);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col md:h-[calc(100vh-7rem)]">
      <h1 className="mb-4 font-serif text-3xl tracking-tight">AI Tutor</h1>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <p className="text-center text-ink-500 dark:text-ink-500">
              Ask me anything you&apos;re studying…
            </p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-coral-500 text-white dark:bg-coral-500'
                      : 'bg-cream-100 text-ink-900 dark:bg-ink-700 dark:text-cream-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-cream-100 px-4 py-2 text-sm text-ink-900 dark:bg-ink-700 dark:text-cream-100">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-cream-200 p-4 dark:border-ink-700"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-lg border border-cream-200 bg-white px-3 py-2 text-base text-ink-900 outline-none placeholder:text-ink-500/60 focus:border-coral-500 focus:ring-1 focus:ring-coral-500 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-50 dark:placeholder:text-cream-50/40 dark:focus:border-coral-500 sm:text-sm"
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
