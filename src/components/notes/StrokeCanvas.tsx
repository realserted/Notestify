'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Stroke } from '@/types/database';

export type Tool = 'text' | 'pen' | 'highlighter' | 'eraser';

interface StrokeCanvasProps {
  width: number;
  height: number;
  tool: Tool;
  color: string;
  size: number;
  initialStrokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
}

export interface StrokeCanvasHandle {
  clear: () => void;
}

const toSvgPath = (points: number[][]): string => {
  if (!points.length) return '';
  const d = points.reduce(
    (acc, [x, y], i, arr) => {
      if (i === 0) return `M ${x} ${y}`;
      const [nx, ny] = arr[i + 1] ?? [x, y];
      return `${acc} Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
    },
    ''
  );
  return `${d} Z`;
};

const STROKE_OPTS_PEN = {
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  simulatePressure: true,
};

const STROKE_OPTS_HIGHLIGHTER = {
  smoothing: 0.3,
  thinning: 0,
  streamline: 0.3,
  simulatePressure: false,
};

const renderStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  const opts = stroke.tool === 'highlighter' ? STROKE_OPTS_HIGHLIGHTER : STROKE_OPTS_PEN;
  const outline = getStroke(stroke.points, { ...opts, size: stroke.size });
  const path = new Path2D(toSvgPath(outline));
  ctx.fillStyle = stroke.color;
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
  ctx.fill(path);
  ctx.globalAlpha = 1;
};

const hitTest = (stroke: Stroke, x: number, y: number, radius = 12): boolean => {
  return stroke.points.some(([px, py]) => {
    const dx = px - x;
    const dy = py - y;
    return dx * dx + dy * dy < radius * radius;
  });
};

export const StrokeCanvas = forwardRef<StrokeCanvasHandle, StrokeCanvasProps>(
  ({ width, height, tool, color, size, initialStrokes, onChange }, ref) => {
    const baseCanvasRef = useRef<HTMLCanvasElement>(null);
    const liveCanvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
    const currentPoints = useRef<Array<[number, number, number]>>([]);
    const drawing = useRef(false);
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

    useImperativeHandle(ref, () => ({
      clear: () => {
        setStrokes([]);
        onChange([]);
      },
    }));

    const redrawBase = useCallback(() => {
      const canvas = baseCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      strokes.forEach((s) => renderStroke(ctx, s));
    }, [strokes, dpr]);

    useEffect(() => {
      redrawBase();
    }, [redrawBase, width, height]);

    const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number, number] => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5];
    };

    const renderLive = (points: Array<[number, number, number]>) => {
      const canvas = liveCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      if (points.length < 2) return;
      renderStroke(ctx, {
        id: 'live',
        tool: tool === 'highlighter' ? 'highlighter' : 'pen',
        color,
        size,
        points,
      });
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (tool === 'text') return;
      if (e.pointerType === 'touch') return;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      const point = getPoint(e);

      if (tool === 'eraser') {
        const next = strokes.filter((s) => !hitTest(s, point[0], point[1]));
        if (next.length !== strokes.length) {
          setStrokes(next);
          onChange(next);
        }
        drawing.current = true;
        return;
      }

      drawing.current = true;
      currentPoints.current = [point];
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      if (tool === 'text') return;

      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

      if (tool === 'eraser') {
        const next = strokes.filter((s) => {
          return !events.some((ev) =>
            hitTest(s, ev.clientX - rect.left, ev.clientY - rect.top)
          );
        });
        if (next.length !== strokes.length) {
          setStrokes(next);
        }
        return;
      }

      events.forEach((ev) => {
        currentPoints.current.push([
          ev.clientX - rect.left,
          ev.clientY - rect.top,
          ev.pressure || 0.5,
        ]);
      });
      renderLive(currentPoints.current);
    };

    const handlePointerUp = () => {
      if (!drawing.current) return;
      drawing.current = false;

      if (tool === 'eraser') {
        onChange(strokes);
        return;
      }

      if (currentPoints.current.length < 2) {
        currentPoints.current = [];
        renderLive([]);
        return;
      }

      const newStroke: Stroke = {
        id: crypto.randomUUID(),
        tool: tool === 'highlighter' ? 'highlighter' : 'pen',
        color,
        size,
        points: currentPoints.current,
      };
      const next = [...strokes, newStroke];
      setStrokes(next);
      onChange(next);
      currentPoints.current = [];
      renderLive([]);
    };

    return (
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{ width, height }}
      >
        <canvas
          ref={baseCanvasRef}
          width={width * dpr}
          height={height * dpr}
          style={{ width, height, position: 'absolute', inset: 0 }}
        />
        <canvas
          ref={liveCanvasRef}
          width={width * dpr}
          height={height * dpr}
          style={{
            width,
            height,
            position: 'absolute',
            inset: 0,
            touchAction: tool === 'text' ? 'auto' : 'none',
            pointerEvents: tool === 'text' ? 'none' : 'auto',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    );
  }
);
StrokeCanvas.displayName = 'StrokeCanvas';
