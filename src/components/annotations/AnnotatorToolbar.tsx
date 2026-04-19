'use client';

import { Download, Eraser, Highlighter, MessageSquare, MousePointer, Pen, Type } from 'lucide-react';
import { cn } from '@/utils/cn';

export type AnnotationTool = 'select' | 'highlight' | 'pen' | 'highlighter' | 'eraser' | 'note';

const HIGHLIGHT_COLORS = ['#fde047', '#86efac', '#fca5a5', '#93c5fd', '#fdba74'];
const PEN_COLORS = ['#1F1E1D', '#D97757', '#2563eb', '#059669', '#dc2626'];
const NOTE_COLORS = ['#D97757', '#fde047', '#2563eb', '#059669'];

interface AnnotatorToolbarProps {
  tool: AnnotationTool;
  color: string;
  size: number;
  onToolChange: (t: AnnotationTool) => void;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
  onExport: () => void;
  exporting: boolean;
}

export const AnnotatorToolbar = ({
  tool,
  color,
  size,
  onToolChange,
  onColorChange,
  onSizeChange,
  onExport,
  exporting,
}: AnnotatorToolbarProps) => {
  const colors =
    tool === 'highlight'
      ? HIGHLIGHT_COLORS
      : tool === 'highlighter'
        ? HIGHLIGHT_COLORS
        : tool === 'note'
          ? NOTE_COLORS
          : PEN_COLORS;
  const showColor = tool !== 'select' && tool !== 'eraser';
  const showSize = tool === 'pen' || tool === 'highlighter';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-200 bg-white p-2 shadow-sm dark:border-ink-700 dark:bg-ink-900/80">
      <div className="flex gap-1">
        <ToolButton active={tool === 'select'} onClick={() => onToolChange('select')} label="Select">
          <MousePointer size={16} />
        </ToolButton>
        <ToolButton
          active={tool === 'highlight'}
          onClick={() => onToolChange('highlight')}
          label="Highlight text"
        >
          <Type size={16} />
        </ToolButton>
        <ToolButton active={tool === 'pen'} onClick={() => onToolChange('pen')} label="Pen">
          <Pen size={16} />
        </ToolButton>
        <ToolButton
          active={tool === 'highlighter'}
          onClick={() => onToolChange('highlighter')}
          label="Highlighter"
        >
          <Highlighter size={16} />
        </ToolButton>
        <ToolButton active={tool === 'note'} onClick={() => onToolChange('note')} label="Sticky note">
          <MessageSquare size={16} />
        </ToolButton>
        <ToolButton
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          label="Eraser"
        >
          <Eraser size={16} />
        </ToolButton>
      </div>

      {showColor && (
        <>
          <div className="h-6 w-px bg-cream-200 dark:bg-ink-700" />
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                aria-label={`Color ${c}`}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform',
                  color === c
                    ? 'scale-110 border-ink-900 dark:border-cream-50'
                    : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </>
      )}

      {showSize && (
        <>
          <div className="h-6 w-px bg-cream-200 dark:bg-ink-700" />
          <input
            type="range"
            min={1}
            max={tool === 'highlighter' ? 32 : 12}
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            aria-label="Stroke size"
            className="w-20 accent-coral-500"
          />
        </>
      )}

      <div className="ml-auto">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-coral-500 px-3 text-sm font-medium text-white hover:bg-coral-600 disabled:opacity-60"
        >
          <Download size={14} />
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  );
};

const ToolButton = ({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
      active
        ? 'bg-coral-500 text-white'
        : 'text-ink-700 hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40',
    )}
  >
    {children}
  </button>
);
