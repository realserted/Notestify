interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
]);

export const tiptapToPlainText = (doc: unknown): string => {
  if (!doc || typeof doc !== 'object') return '';
  const parts: string[] = [];

  const walk = (node: TiptapNode) => {
    if (node.text) parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
    if (node.type && BLOCK_TYPES.has(node.type)) parts.push('\n');
  };

  walk(doc as TiptapNode);
  return parts.join('').replace(/\n{2,}/g, '\n\n').trim();
};
