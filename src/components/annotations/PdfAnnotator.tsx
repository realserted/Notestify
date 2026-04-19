'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type {
  AnnotationData,
  DocumentAnnotation,
  HighlightData,
  NoteAnnotationData,
  StrokeAnnotationData,
} from '@/types/database';
import { AnnotatorToolbar, type AnnotationTool } from './AnnotatorToolbar';
import { AnnotationSidebar } from './AnnotationSidebar';
import { PdfPage } from './PdfPage';
import { exportAnnotatedPdf } from './exportPdf';
import { useFeatureTour } from '@/components/tutorial/useFeatureTour';

interface PdfAnnotatorProps {
  documentId: string;
  documentTitle: string;
  initialAnnotations: DocumentAnnotation[];
}

type PdfDocument = { numPages: number; getPage: (n: number) => Promise<PdfPageApi> };
type PdfPageApi = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: { str: string; transform: number[]; width: number; height: number }[] }>;
};

export const PdfAnnotator = ({
  documentId,
  documentTitle,
  initialAnnotations,
}: PdfAnnotatorProps) => {
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>(initialAnnotations);
  const [tool, setTool] = useState<AnnotationTool>('select');
  const [color, setColor] = useState('#fde047');
  const [size, setSize] = useState(3);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const res = await fetch(`/api/documents/${documentId}/url`);
        if (!res.ok) throw new Error('Could not fetch document');
        const { url } = await res.json();
        const pdfRes = await fetch(url);
        const bytes = await pdfRes.arrayBuffer();
        if (cancelled) return;
        setPdfBytes(bytes);

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          isEvalSupported: false,
          disableAutoFetch: true,
          disableStream: true,
        });
        const loaded = await loadingTask.promise;
        if (cancelled) return;
        setPdf(loaded as unknown as PdfDocument);
      } catch (err) {
        console.error(err);
        setLoadError('Could not load this PDF.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  useEffect(() => {
    if (tool === 'highlight') setColor((c) => (c === '#1F1E1D' ? '#fde047' : c));
    if (tool === 'pen') setColor((c) => (c.startsWith('#fd') ? '#1F1E1D' : c));
  }, [tool]);

  useFeatureTour(
    'pdf-annotator',
    [
      {
        element: '[data-tour="annot-tool-highlight"]',
        popover: {
          title: 'Highlight text',
          description: 'Click this, then drag to select text on the PDF. It highlights in the color you pick below.',
        },
      },
      {
        element: '[data-tour="annot-tool-pen"]',
        popover: {
          title: 'Pen',
          description: 'Draw freehand on top of the page. Apple Pencil pressure works on iPad Safari — finger touches are ignored so your palm won\'t draw.',
        },
      },
      {
        element: '[data-tour="annot-tool-highlighter"]',
        popover: {
          title: 'Ink highlighter',
          description: 'Translucent strokes — same as the pen but for emphasis.',
        },
      },
      {
        element: '[data-tour="annot-tool-note"]',
        popover: {
          title: 'Sticky note',
          description: 'Click anywhere on the page to drop a note pin. Type your comment, then click the pin later to reopen it.',
        },
      },
      {
        element: '[data-tour="annot-tool-eraser"]',
        popover: {
          title: 'Eraser',
          description: 'Click on any stroke or highlight to remove it. Sticky notes have their own delete button.',
        },
      },
      {
        element: '[data-tour="annot-export"]',
        popover: {
          title: 'Export',
          description: 'Download a new PDF with every highlight, stroke, and sticky note baked into the page — ready to share.',
        },
      },
    ],
    pdf !== null,
  );

  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  const saveAnnotation = useCallback(
    (payload: {
      page: number;
      kind: 'highlight' | 'note' | 'stroke';
      data: AnnotationData;
    }) => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimistic: DocumentAnnotation = {
        id: tempId,
        user_id: '',
        document_id: documentId,
        page: payload.page,
        kind: payload.kind,
        data: payload.data,
        created_at: now,
        updated_at: now,
      };
      setAnnotations((prev) => [...prev, optimistic]);

      fetch(`/api/documents/${documentId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('save failed');
          const { annotation } = await res.json();
          setAnnotations((prev) =>
            prev.map((a) => (a.id === tempId ? annotation : a)),
          );
        })
        .catch(() => {
          setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
        });
    },
    [documentId],
  );

  const handleAddHighlight = useCallback(
    (page: number, data: HighlightData) => saveAnnotation({ page, kind: 'highlight', data }),
    [saveAnnotation],
  );

  const handleAddStroke = useCallback(
    (page: number, data: StrokeAnnotationData) => saveAnnotation({ page, kind: 'stroke', data }),
    [saveAnnotation],
  );

  const handleAddNote = useCallback(
    (page: number, data: NoteAnnotationData) => saveAnnotation({ page, kind: 'note', data }),
    [saveAnnotation],
  );

  const handleUpdate = (id: string, data: AnnotationData) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, data } : a)));
    if (id.startsWith('temp-')) return;
    fetch(`/api/annotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (id.startsWith('temp-')) return;
    fetch(`/api/annotations/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleUpdateNote = (id: string, note: string) => {
    const target = annotations.find((a) => a.id === id);
    if (!target) return;
    if (target.kind === 'highlight') {
      handleUpdate(id, { ...(target.data as HighlightData), note });
    } else if (target.kind === 'stroke') {
      handleUpdate(id, { ...(target.data as StrokeAnnotationData), note });
    }
  };

  const handleExport = async () => {
    if (!pdfBytes) return;
    setExporting(true);
    try {
      const out = await exportAnnotatedPdf(pdfBytes, annotations);
      const blob = new Blob([out as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle.replace(/\.pdf$/i, '')}-annotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Link
            href="/uploads"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-cream-50/70 dark:hover:text-cream-50"
          >
            <ChevronLeft size={16} /> Uploads
          </Link>
          <h1 className="mt-1 font-serif text-2xl tracking-tight">{documentTitle}</h1>
        </div>
        {pdf && (
          <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-cream-50/70">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 rounded-md border border-cream-200 px-3 disabled:opacity-40 dark:border-ink-700"
            >
              Prev
            </button>
            <span>
              {currentPage} / {pdf.numPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(pdf.numPages, p + 1))}
              disabled={currentPage >= pdf.numPages}
              className="h-8 rounded-md border border-cream-200 px-3 disabled:opacity-40 dark:border-ink-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <AnnotatorToolbar
          tool={tool}
          color={color}
          size={size}
          onToolChange={setTool}
          onColorChange={setColor}
          onSizeChange={setSize}
          onExport={handleExport}
          exporting={exporting}
        />
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-cream-200 dark:border-ink-700">
        <div
          ref={pageContainerRef}
          className="flex-1 overflow-auto bg-cream-100 p-6 dark:bg-ink-900"
        >
          {loadError && (
            <p className="text-center text-sm text-red-600">{loadError}</p>
          )}
          {!pdf && !loadError && (
            <p className="text-center text-sm text-ink-500 dark:text-cream-50/70">
              Loading PDF…
            </p>
          )}
          {pdf && (
            <PdfPage
              key={currentPage}
              pdf={pdf}
              pageNumber={currentPage}
              scale={1.3}
              annotations={pageAnnotations}
              tool={tool}
              color={color}
              size={size}
              onAddHighlight={handleAddHighlight}
              onAddStroke={handleAddStroke}
              onAddNote={handleAddNote}
              onUpdateAnnotation={handleUpdate}
              onDeleteAnnotation={handleDelete}
            />
          )}
        </div>
        <AnnotationSidebar
          annotations={annotations}
          onDelete={handleDelete}
          onJump={setCurrentPage}
          onUpdateNote={handleUpdateNote}
        />
      </div>
    </div>
  );
};
