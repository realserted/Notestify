'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Markdown } from '@/components/ui/Markdown';

interface Props {
  initialDocuments: Document[];
}

type ProcessingAction = 'extract' | 'summarize';

const STATUS_CHIPS: Record<string, string> = {
  ready: 'bg-olive-300 text-espresso-700',
  processing: 'bg-citrus-500 text-espresso-700',
  failed: 'bg-clay-500 text-espresso-700',
};

export const UploadManager = ({ initialDocuments }: Props) => {
  const supabase = createClient();
  const [documents, setDocuments] = useState(initialDocuments);

  const patchDocument = (id: string, patch: Partial<Document>) =>
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<{ id: string; action: ProcessingAction } | null>(
    null,
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw upErr;

      const { data: doc, error: insErr } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          storage_path: path,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      setDocuments((prev) => [doc as Document, ...prev]);
    } catch (err) {
      alert('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleExtract = async (docId: string) => {
    setProcessing({ id: docId, action: 'extract' });
    patchDocument(docId, { status: 'processing' });
    const res = await fetch('/api/pdf/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId }),
    });
    setProcessing(null);
    if (!res.ok) {
      patchDocument(docId, { status: 'failed' });
      return alert('Extraction failed');
    }
    const { text } = await res.json();
    patchDocument(docId, { extracted_text: text, status: 'ready' });
  };

  const handleSummarize = async (doc: Document) => {
    if (!doc.extracted_text) return alert('Extract text first');
    setProcessing({ id: doc.id, action: 'summarize' });
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: doc.extracted_text, document_id: doc.id }),
    });
    setProcessing(null);
    if (!res.ok) return alert('Summarization failed');
    const { summary } = await res.json();
    patchDocument(doc.id, { summary });
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-[30px] font-extrabold tracking-[-0.03em]">Uploads</h1>

      <div className="rounded-pop border-2 border-dashed border-paper-300 bg-paper-50 p-[38px] text-center dark:border-night-600 dark:bg-night-800">
        <p className="font-display text-xl font-bold tracking-[-0.02em]">
          Drop a PDF, DOCX, or PPTX
        </p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500 dark:text-bark-300">
          Max 25 MB · extract the text once it&apos;s uploaded
        </p>
        <label className="mt-[18px] inline-block cursor-pointer">
          <input
            type="file"
            accept=".pdf,.docx,.pptx"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
          <span className="inline-flex h-11 items-center rounded-full border-2 border-espresso-700 bg-paper-50 px-5 text-sm font-bold text-espresso-700 transition-colors hover:bg-paper-200 dark:border-night-600 dark:bg-night-800 dark:text-foam-50 dark:hover:bg-night-700">
            {uploading ? 'Uploading…' : 'Choose a file'}
          </span>
        </label>
      </div>

      {uploading && <ProgressBar progress={null} label="Uploading…" />}

      {documents.length === 0 ? (
        <Card>
          <p className="text-bark-500 dark:text-bark-300">No documents yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{doc.title}</p>
                  <span
                    className={`mt-1.5 inline-block rounded-full border-2 border-espresso-700 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] dark:border-espresso-900 ${
                      STATUS_CHIPS[doc.status] ?? STATUS_CHIPS.processing
                    }`}
                  >
                    {doc.status}
                  </span>
                  {doc.summary && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-citrus-600 dark:text-citrus-500">
                        View summary
                      </summary>
                      <Markdown
                        content={doc.summary}
                        className="mt-2 text-sm text-bark-700 dark:text-foam-50/80"
                      />
                    </details>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {(doc.mime_type ?? '').includes('pdf') && (
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="outline">
                        Annotate
                      </Button>
                    </Link>
                  )}
                  {!doc.extracted_text && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={processing?.id === doc.id && processing.action === 'extract'}
                      onClick={() => handleExtract(doc.id)}
                    >
                      Extract
                    </Button>
                  )}
                  {doc.extracted_text && !doc.summary && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={processing?.id === doc.id && processing.action === 'summarize'}
                      onClick={() => handleSummarize(doc)}
                    >
                      Summarize
                    </Button>
                  )}
                </div>
              </div>
              {processing?.id === doc.id && (
                <div className="mt-3">
                  <ProgressBar
                    progress={null}
                    label={processing.action === 'extract' ? 'Extracting text…' : 'Summarizing…'}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
