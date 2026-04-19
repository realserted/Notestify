'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  DocumentAnnotation,
  HighlightData,
  NoteAnnotationData,
  StrokeAnnotationData,
} from '@/types/database';
import { strokeToSvgPath } from './pdfPath';
import { StickyNote } from './StickyNote';
import type { AnnotationTool } from './AnnotatorToolbar';

type PdfDocument = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: TextItem[] }>;
};
type TextItem = { str: string; transform: number[]; width: number; height: number };

interface PdfPageProps {
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  annotations: DocumentAnnotation[];
  tool: AnnotationTool;
  color: string;
  size: number;
  onAddHighlight: (page: number, data: HighlightData) => void;
  onAddStroke: (page: number, data: StrokeAnnotationData) => void;
  onAddNote: (page: number, data: NoteAnnotationData) => void;
  onUpdateAnnotation: (id: string, data: HighlightData | NoteAnnotationData | StrokeAnnotationData) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const PdfPage = ({
  pdf,
  pageNumber,
  scale,
  annotations,
  tool,
  color,
  size,
  onAddHighlight,
  onAddStroke,
  onAddNote,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const currentPoints = useRef<Array<[number, number, number]>>([]);
  const drawing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      if (cancelled) return;
      setDims({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;

      if (textLayerRef.current) {
        const layer = textLayerRef.current;
        layer.innerHTML = '';
        const textContent = await page.getTextContent();
        textContent.items.forEach((item) => {
          if (!item.str.trim()) return;
          const tx = item.transform;
          const fontHeight = Math.hypot(tx[2], tx[3]) * scale;
          const left = tx[4] * scale;
          const top = viewport.height - tx[5] * scale - fontHeight;
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.position = 'absolute';
          span.style.left = `${left}px`;
          span.style.top = `${top}px`;
          span.style.fontSize = `${fontHeight}px`;
          span.style.whiteSpace = 'pre';
          span.style.color = 'transparent';
          span.style.userSelect = 'text';
          span.style.cursor = tool === 'highlight' ? 'text' : 'default';
          layer.appendChild(span);
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, tool]);

  useEffect(() => {
    if (tool !== 'highlight') return;
    const layer = textLayerRef.current;
    if (!layer) return;

    const handleUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const range = selection.getRangeAt(0);
      if (!layer.contains(range.commonAncestorContainer)) return;
      const pageRect = layer.getBoundingClientRect();
      const rects = Array.from(range.getClientRects())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({
          x: (r.left - pageRect.left) / dims.width,
          y: (r.top - pageRect.top) / dims.height,
          w: r.width / dims.width,
          h: r.height / dims.height,
        }));
      if (!rects.length) return;
      onAddHighlight(pageNumber, { color, rects, text: selection.toString() });
      selection.removeAllRanges();
    };

    layer.addEventListener('mouseup', handleUp);
    layer.addEventListener('touchend', handleUp);
    return () => {
      layer.removeEventListener('mouseup', handleUp);
      layer.removeEventListener('touchend', handleUp);
    };
  }, [tool, color, dims, pageNumber, onAddHighlight]);

  const renderLive = (points: Array<[number, number, number]>) => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (points.length < 2) return;
    const path = new Path2D(strokeToSvgPath(points, size, tool === 'highlighter'));
    ctx.fillStyle = color;
    ctx.globalAlpha = tool === 'highlighter' ? 0.35 : 1;
    ctx.fill(path);
    ctx.globalAlpha = 1;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== 'pen' && tool !== 'highlighter' && tool !== 'eraser' && tool !== 'note') return;
    if (e.pointerType === 'touch') return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const px = (e.clientX - rect.left) / dims.width;
    const py = (e.clientY - rect.top) / dims.height;

    if (tool === 'note') {
      const text = window.prompt('Note text:');
      if (text && text.trim()) {
        onAddNote(pageNumber, { x: px, y: py, color, text: text.trim() });
      }
      return;
    }

    if (tool === 'eraser') {
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      for (const a of annotations) {
        if (a.kind === 'stroke') {
          const s = a.data as StrokeAnnotationData;
          const hit = s.points.some(([px2, py2]) => {
            const dx = px2 * dims.width - pointerX;
            const dy = py2 * dims.height - pointerY;
            return dx * dx + dy * dy < 200;
          });
          if (hit) onDeleteAnnotation(a.id);
        } else if (a.kind === 'highlight') {
          const h = a.data as HighlightData;
          const hit = h.rects.some(
            (r) =>
              pointerX >= r.x * dims.width &&
              pointerX <= (r.x + r.w) * dims.width &&
              pointerY >= r.y * dims.height &&
              pointerY <= (r.y + r.h) * dims.height,
          );
          if (hit) onDeleteAnnotation(a.id);
        }
      }
      return;
    }

    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    currentPoints.current = [[px, py, e.pressure || 0.5]];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    events.forEach((ev) => {
      currentPoints.current.push([
        (ev.clientX - rect.left) / dims.width,
        (ev.clientY - rect.top) / dims.height,
        ev.pressure || 0.5,
      ]);
    });
    const pixelPoints = currentPoints.current.map(
      ([x, y, p]) => [x * dims.width, y * dims.height, p] as [number, number, number],
    );
    renderLive(pixelPoints);
  };

  const handlePointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPoints.current.length < 2) {
      currentPoints.current = [];
      renderLive([]);
      return;
    }
    onAddStroke(pageNumber, {
      tool: tool === 'highlighter' ? 'highlighter' : 'pen',
      color,
      size,
      points: [...currentPoints.current],
    });
    currentPoints.current = [];
    renderLive([]);
  };

  const canDraw = tool === 'pen' || tool === 'highlighter' || tool === 'eraser' || tool === 'note';

  return (
    <div
      className="relative mx-auto shadow-md"
      style={{ width: dims.width, height: dims.height, background: '#fff' }}
    >
      <canvas ref={canvasRef} className="block" />
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden leading-none"
        style={{
          pointerEvents: tool === 'highlight' ? 'auto' : 'none',
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0"
        width={dims.width}
        height={dims.height}
      >
        {annotations.map((a) => {
          if (a.kind === 'highlight') {
            const h = a.data as HighlightData;
            return (
              <g key={a.id}>
                {h.rects.map((r, i) => (
                  <rect
                    key={i}
                    x={r.x * dims.width}
                    y={r.y * dims.height}
                    width={r.w * dims.width}
                    height={r.h * dims.height}
                    fill={h.color}
                    opacity={0.35}
                  />
                ))}
              </g>
            );
          }
          if (a.kind === 'stroke') {
            const s = a.data as StrokeAnnotationData;
            const pxPoints = s.points.map(
              ([x, y, p]) => [x * dims.width, y * dims.height, p] as [number, number, number],
            );
            const d = strokeToSvgPath(pxPoints, s.size, s.tool === 'highlighter');
            return (
              <path
                key={a.id}
                d={d}
                fill={s.color}
                opacity={s.tool === 'highlighter' ? 0.35 : 1}
              />
            );
          }
          return null;
        })}
      </svg>
      {annotations
        .filter((a) => a.kind === 'note')
        .map((a) => {
          const n = a.data as NoteAnnotationData;
          return (
            <StickyNote
              key={a.id}
              x={n.x * dims.width}
              y={n.y * dims.height}
              color={n.color}
              text={n.text}
              onChange={(text) => onUpdateAnnotation(a.id, { ...n, text })}
              onDelete={() => onDeleteAnnotation(a.id)}
            />
          );
        })}
      <canvas
        ref={liveCanvasRef}
        width={dims.width}
        height={dims.height}
        className="absolute inset-0"
        style={{
          pointerEvents: canDraw ? 'auto' : 'none',
          touchAction: canDraw ? 'none' : 'auto',
          cursor: tool === 'eraser' ? 'cell' : tool === 'note' ? 'copy' : 'crosshair',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};
