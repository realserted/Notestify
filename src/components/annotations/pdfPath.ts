import { getStroke } from 'perfect-freehand';

export const strokeToSvgPath = (points: Array<[number, number, number]>, size: number, isHighlighter: boolean): string => {
  const outline = getStroke(points, {
    size,
    smoothing: isHighlighter ? 0.3 : 0.5,
    thinning: isHighlighter ? 0 : 0.5,
    streamline: isHighlighter ? 0.3 : 0.5,
    simulatePressure: !isHighlighter,
  });
  if (!outline.length) return '';
  return outline.reduce((acc, [x, y], i, arr) => {
    if (i === 0) return `M ${x} ${y}`;
    const [nx, ny] = arr[i + 1] ?? [x, y];
    return `${acc} Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }, '') + ' Z';
};
