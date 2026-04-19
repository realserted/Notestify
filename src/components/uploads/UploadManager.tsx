'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface Props {
  initialDocuments: Document[];
}

type ProcessingAction = 'extract' | 'summarize';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Uploads</h1>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <span className="inline-flex h-10 items-center rounded-md bg-coral-500 px-4 text-sm font-medium text-white hover:bg-coral-600">
            {uploading ? 'Uploading…' : '+ Upload PDF'}
          </span>
        </label>
      </div>

      {uploading && <ProgressBar progress={null} label="Uploading PDF…" />}

      {documents.length === 0 ? (
        <Card>
          <p className="text-ink-500">No documents yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.title}</p>
                  <p className="text-sm text-ink-500">Status: {doc.status}</p>
                  {doc.summary && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-coral-500">
                        View summary
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-ink-700 dark:text-cream-50/80">
                        {doc.summary}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
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
