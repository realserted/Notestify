'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Sparkles, FileText } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Note, PaperStyle, Stroke } from '@/types/database';
import { PaperBackground } from './PaperBackground';
import { StrokeCanvas, type Tool, type StrokeCanvasHandle } from './StrokeCanvas';
import { ToolPalette } from './ToolPalette';
import { Button } from '@/components/ui/Button';
import { useFeatureTour } from '@/components/tutorial/useFeatureTour';

interface NoteEditorProps {
  note: Note;
  notebookId: string;
  notebookTitle: string;
}

const AUTOSAVE_MS = 800;
const PAGE_PADDING = 64;

export const NoteEditor = ({ note, notebookId, notebookTitle }: NoteEditorProps) => {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [paper, setPaper] = useState<PaperStyle>(note.paper_style);
  const [strokes, setStrokes] = useState<Stroke[]>(note.strokes ?? []);
  const [tool, setTool] = useState<Tool>('text');
  const [color, setColor] = useState('#1F1E1D');
  const [penSize, setPenSize] = useState(3);
  const [highlighterSize, setHighlighterSize] = useState(18);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<'flashcards' | 'quiz' | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<StrokeCanvasHandle>(null);
  const [dims, setDims] = useState({ width: 800, height: 1100 });

  useFeatureTour('note-editor', [
    {
      element: '[data-tour="note-tool-text"]',
      popover: {
        title: 'Type like a doc',
        description: 'Text mode writes rich text on the page. Switch modes any time — your text and ink live side by side.',
      },
    },
    {
      element: '[data-tour="note-tool-pen"]',
      popover: {
        title: 'Pen — scribble and sketch',
        description: 'Apple Pencil pressure works on iPad. On desktop, drag with your mouse. Pick a color and size below.',
      },
    },
    {
      element: '[data-tour="note-tool-highlighter"]',
      popover: {
        title: 'Highlighter',
        description: 'Translucent strokes that sit on top of your text. Great for emphasizing key bits.',
      },
    },
    {
      element: '[data-tour="note-tool-eraser"]',
      popover: {
        title: 'Eraser',
        description: 'Drag across any stroke to remove it. Only affects ink, not typed text.',
      },
    },
    {
      element: '[data-tour="note-paper"]',
      popover: {
        title: 'Paper style',
        description: 'Ruled, grid, dotted, blank, or cornell. Switch any time — it updates live.',
      },
    },
    {
      element: '[data-tour="note-generate-flashcards"]',
      popover: {
        title: 'Flashcards from your note',
        description: 'Turns the typed text on this page into a new deck of AI-generated flashcards.',
      },
    },
    {
      element: '[data-tour="note-generate-quiz"]',
      popover: {
        title: 'Quiz from your note',
        description: 'Same idea — turns this page into a multi-format quiz. Pages autosave as you go.',
      },
    },
  ]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none min-h-[1040px] focus:outline-none dark:prose-invert',
      },
    },
    immediatelyRender: false,
  });

  const currentSize = tool === 'highlighter' ? highlighterSize : penSize;
  const handleSizeChange = (s: number) =>
    tool === 'highlighter' ? setHighlighterSize(s) : setPenSize(s);

  const patchPayload = useMemo(() => {
    return (extras: Partial<Note> = {}) => ({
      title,
      paper_style: paper,
      content: editor?.getJSON(),
      strokes,
      ...extras,
    });
  }, [title, paper, editor, strokes]);

  const save = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaving(false);
    },
    [note.id]
  );

  useEffect(() => {
    if (!editor) return;
    const timer = setTimeout(() => save(patchPayload()), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [title, paper, strokes, editor, save, patchPayload]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const timer = setTimeout(() => save(patchPayload()), AUTOSAVE_MS);
      return () => clearTimeout(timer);
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
    };
  }, [editor, save, patchPayload]);

  useEffect(() => {
    if (!pageRef.current) return;
    const el = pageRef.current;
    const observer = new ResizeObserver(() => {
      setDims({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  const handleGenerate = async (kind: 'flashcards' | 'quiz') => {
    await save(patchPayload());
    setGenerating(kind);
    const res = await fetch(`/api/notes/${note.id}/${kind}`, { method: 'POST' });
    setGenerating(null);
    if (res.ok) {
      const data = await res.json();
      if (kind === 'flashcards' && data.deck_id) {
        router.push(`/decks/${data.deck_id}`);
      } else if (kind === 'quiz' && data.quiz_id) {
        router.push(`/quizzes/${data.quiz_id}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/notes/${notebookId}`}
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-cream-50/70 dark:hover:text-cream-50"
          >
            <ChevronLeft size={16} /> {notebookTitle}
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled page"
            className="mt-1 w-full border-none bg-transparent p-0 font-serif text-2xl tracking-tight text-ink-900 outline-none placeholder:text-ink-500/40 dark:text-cream-50 sm:text-3xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500 dark:text-cream-50/50">
            {saving ? 'Saving…' : 'Saved'}
          </span>
          <Button
            data-tour="note-generate-flashcards"
            size="sm"
            variant="outline"
            onClick={() => handleGenerate('flashcards')}
            loading={generating === 'flashcards'}
          >
            <Sparkles size={14} className="mr-1" />
            Flashcards
          </Button>
          <Button
            data-tour="note-generate-quiz"
            size="sm"
            variant="outline"
            onClick={() => handleGenerate('quiz')}
            loading={generating === 'quiz'}
          >
            <FileText size={14} className="mr-1" />
            Quiz
          </Button>
        </div>
      </div>

      <ToolPalette
        tool={tool}
        color={color}
        size={currentSize}
        paper={paper}
        onToolChange={setTool}
        onColorChange={setColor}
        onSizeChange={handleSizeChange}
        onPaperChange={setPaper}
        onClear={() => canvasRef.current?.clear()}
      />

      <div className="mx-auto max-w-4xl">
        <div
          ref={pageRef}
          className="relative overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm dark:border-ink-700 dark:bg-ink-900"
          style={{ minHeight: 1100, padding: PAGE_PADDING, touchAction: tool === 'text' ? 'auto' : 'none' }}
        >
          <PaperBackground style={paper} />
          <div className="relative z-10">
            <EditorContent editor={editor} />
          </div>
          <StrokeCanvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            tool={tool}
            color={color}
            size={currentSize}
            initialStrokes={strokes}
            onChange={setStrokes}
          />
        </div>
      </div>
    </div>
  );
};
