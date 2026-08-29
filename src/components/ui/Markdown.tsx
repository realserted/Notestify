import { Fragment, type ReactNode } from 'react';

// Minimal Markdown renderer for tutor replies. Gemini emits **bold**, bullet
// lists and the occasional heading; without this they render as literal
// asterisks. Deliberately small — no dependency, no HTML passthrough, and
// anything it doesn't recognise falls through as plain text.

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;

/** Bold, italic and inline code inside a single line. */
const renderInline = (text: string): ReactNode[] =>
  text.split(INLINE).map((part, i) => {
    if (i % 2 === 0) return part ? <Fragment key={i}>{part}</Fragment> : null;

    if (part.startsWith('**') || part.startsWith('__')) {
      return (
        <strong key={i} className="font-bold text-espresso-700 dark:text-foam-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-night-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return (
      <em key={i} className="italic">
        {part.slice(1, -1)}
      </em>
    );
  });

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'h'; level: number; text: string };

const BULLET = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^(#{1,4})\s+(.*)$/;

const parse = (src: string): Block[] => {
  const blocks: Block[] = [];

  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];

    if (!line.trim()) {
      // Blank line closes whatever block is open.
      if (last?.kind === 'p') blocks.push({ kind: 'p', lines: [] });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: 'h', level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      if (last?.kind === 'ul') last.items.push(bullet[1]);
      else blocks.push({ kind: 'ul', items: [bullet[1]] });
      continue;
    }

    const ordered = ORDERED.exec(line);
    if (ordered) {
      if (last?.kind === 'ol') last.items.push(ordered[1]);
      else blocks.push({ kind: 'ol', items: [ordered[1]] });
      continue;
    }

    if (last?.kind === 'p' && last.lines.length > 0) last.lines.push(line);
    else blocks.push({ kind: 'p', lines: [line] });
  }

  return blocks.filter((b) => b.kind !== 'p' || b.lines.length > 0);
};

export const Markdown = ({ content, className }: { content: string; className?: string }) => {
  const blocks = parse(content);

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {blocks.map((block, i) => {
        if (block.kind === 'h') {
          return (
            <p
              key={i}
              className="font-display text-[16px] font-bold tracking-[-0.02em] text-espresso-700 dark:text-foam-50"
            >
              {renderInline(block.text)}
            </p>
          );
        }
        if (block.kind === 'ul') {
          return (
            <ul key={i} className="ml-1 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-citrus-500" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === 'ol') {
          return (
            <ol key={i} className="ml-1 space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="shrink-0 font-bold text-citrus-600 dark:text-citrus-500">
                    {j + 1}.
                  </span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{renderInline(block.lines.join(' '))}</p>;
      })}
    </div>
  );
};
