'use client';

import { Eraser, Highlighter, Pen, Trash2, Type } from 'lucide-react';
import type { Tool } from './StrokeCanvas';
import type { PaperStyle } from '@/types/database';
import { cn } from '@/utils/cn';

const PEN_COLORS = ['#1F1E1D', '#D97757', '#2563eb', '#059669', '#dc2626'];
const HIGHLIGHTER_COLORS = ['#fde047', '#86efac', '#fca5a5', '#93c5fd'];
const PAPER_STYLES: { value: PaperStyle; label: string }[] = [
  { value: 'ruled', label: 'Ruled' },
  { value: 'grid', label: 'Grid' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'blank', label: 'Blank' },
  { value: 'cornell', label: 'Cornell' },
];

interface ToolPaletteProps {
  tool: Tool;
  color: string;
  size: number;
  paper: PaperStyle;
  onToolChange: (t: Tool) => void;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
  onPaperChange: (p: PaperStyle) => void;
  onClear: () => void;
}

export const ToolPalette = ({
  tool,
  color,
  size,
  paper,
  onToolChange,
  onColorChange,
  onSizeChange,
  onPaperChange,
  onClear,
}: ToolPaletteProps) => {
  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;
  const isInk = tool === 'pen' || tool === 'highlighter';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-200 bg-white p-2 shadow-sm dark:border-ink-700 dark:bg-ink-900/80">
      <div className="flex gap-1">
        <ToolButton active={tool === 'text'} onClick={() => onToolChange('text')} label="Text">
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
        <ToolButton
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          label="Eraser"
        >
          <Eraser size={16} />
        </ToolButton>
      </div>

      {isInk && (
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
                    : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
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

      <div className="h-6 w-px bg-cream-200 dark:bg-ink-700" />
      <select
        value={paper}
        onChange={(e) => onPaperChange(e.target.value as PaperStyle)}
        className="h-8 rounded-md border border-cream-200 bg-white px-2 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-50"
      >
        {PAPER_STYLES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="ml-auto">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear strokes"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-cream-100 hover:text-red-600 dark:text-cream-50/60 dark:hover:bg-ink-700/40"
        >
          <Trash2 size={16} />
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
        : 'text-ink-700 hover:bg-cream-100 dark:text-cream-50 dark:hover:bg-ink-700/40'
    )}
  >
    {children}
  </button>
);
