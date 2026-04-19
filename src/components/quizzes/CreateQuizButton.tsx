'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { extractFileWithProgress } from '@/lib/extract/client';

export const CreateQuizButton = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'extracting'>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [sourceFile, setSourceFile] = useState<string | null>(null);
  const extracting = stage !== 'idle';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setStage('uploading');
    setUploadPct(0);
    setSourceFile(file.name);

    try {
      const { text, filename } = await extractFileWithProgress(file, (pct) => {
        setUploadPct(pct);
        if (pct >= 100) setStage('extracting');
      });
      setContent(text);
      setSourceFile(filename);
      if (!title) setTitle(filename.replace(/\.[^.]+$/, ''));
    } catch (err) {
      alert(`Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSourceFile(null);
    } finally {
      setStage('idle');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, count }),
    });
    setLoading(false);
    if (!res.ok) {
      alert('Generation failed');
      return;
    }
    const { quiz } = await res.json();
    setOpen(false);
    router.push(`/quizzes/${quiz.id}`);
  };

  if (!open) {
    return <Button onClick={() => setOpen(true)}>✨ AI Generate Quiz</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
      <form
        onSubmit={handleGenerate}
        className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Generate Quiz</h2>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={handleFile}
              disabled={extracting || loading}
            />
            {stage === 'uploading'
              ? 'Uploading…'
              : stage === 'extracting'
                ? 'Extracting…'
                : 'Upload PDF / DOCX / PPTX'}
          </label>
          {sourceFile && stage === 'idle' && (
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
              From: {sourceFile}
            </span>
          )}
        </div>
        {stage !== 'idle' && (
          <ProgressBar
            progress={stage === 'uploading' ? uploadPct : null}
            label={
              stage === 'uploading'
                ? `Uploading ${sourceFile ?? 'file'}…`
                : 'Extracting text from file…'
            }
          />
        )}
        <Textarea
          label="Source content (or upload a file above)"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSourceFile(null);
          }}
          required
          rows={6}
        />
        <Input
          label="Number of questions"
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Generate
          </Button>
        </div>
      </form>
    </div>
  );
};
