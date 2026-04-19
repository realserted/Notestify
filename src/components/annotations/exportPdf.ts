import { PDFDocument, rgb } from 'pdf-lib';
import { getStroke } from 'perfect-freehand';
import type {
  DocumentAnnotation,
  HighlightData,
  NoteAnnotationData,
  StrokeAnnotationData,
} from '@/types/database';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const num = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return { r: ((num >> 16) & 255) / 255, g: ((num >> 8) & 255) / 255, b: (num & 255) / 255 };
};

export const exportAnnotatedPdf = async (
  pdfBytes: ArrayBuffer,
  annotations: DocumentAnnotation[],
): Promise<Uint8Array> => {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();

  for (const a of annotations) {
    const page = pages[a.page - 1];
    if (!page) continue;
    const { width, height } = page.getSize();

    if (a.kind === 'highlight') {
      const h = a.data as HighlightData;
      const { r, g, b } = hexToRgb(h.color);
      for (const rect of h.rects) {
        page.drawRectangle({
          x: rect.x * width,
          y: height - (rect.y + rect.h) * height,
          width: rect.w * width,
          height: rect.h * height,
          color: rgb(r, g, b),
          opacity: 0.35,
        });
      }
    } else if (a.kind === 'stroke') {
      const s = a.data as StrokeAnnotationData;
      const { r, g, b } = hexToRgb(s.color);
      const pixelPoints = s.points.map(
        ([x, y, p]) => [x * width, y * height, p] as [number, number, number],
      );
      const outline = getStroke(pixelPoints, {
        size: s.size,
        smoothing: s.tool === 'highlighter' ? 0.3 : 0.5,
        thinning: s.tool === 'highlighter' ? 0 : 0.5,
        streamline: s.tool === 'highlighter' ? 0.3 : 0.5,
        simulatePressure: s.tool === 'pen',
      });
      if (outline.length < 3) continue;
      const moves = outline
        .map(([x, y], i) => {
          const ly = height - y;
          return i === 0 ? `M ${x} ${ly}` : `L ${x} ${ly}`;
        })
        .join(' ');
      page.drawSvgPath(`${moves} Z`, {
        color: rgb(r, g, b),
        opacity: s.tool === 'highlighter' ? 0.35 : 1,
        borderWidth: 0,
      });
    } else if (a.kind === 'note') {
      const n = a.data as NoteAnnotationData;
      const { r, g, b } = hexToRgb(n.color);
      const nx = n.x * width;
      const ny = height - n.y * height;
      page.drawCircle({ x: nx, y: ny, size: 6, color: rgb(r, g, b) });
      page.drawText(n.text, {
        x: nx + 10,
        y: ny - 4,
        size: 9,
        color: rgb(0.12, 0.12, 0.11),
        maxWidth: 180,
      });
    }
  }

  return doc.save();
};
