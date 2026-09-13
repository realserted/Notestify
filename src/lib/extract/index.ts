import mammoth from 'mammoth';
import { parseOffice } from 'officeparser';
import { extractTextFromPDF } from '@/lib/pdf/extract';

export type SupportedExtension = 'pdf' | 'docx' | 'pptx';

const getExtension = (filename: string): SupportedExtension | null => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1];
  if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') return ext;
  return null;
};

/**
 * Extract text when the format is already known.
 *
 * Drive hands us an authoritative MIME type and a name that often carries no
 * extension at all — a Google Doc is just "Biology Notes". Taking the format
 * directly avoids fabricating a filename to smuggle it through a parameter
 * that means something else.
 */
export const extractText = async (
  buffer: Buffer,
  format: SupportedExtension
): Promise<string> => {
  if (format === 'pdf') {
    return extractTextFromPDF(buffer);
  }

  if (format === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  const ast = await parseOffice(buffer);
  return ast.toText().trim();
};

/** Extract from an uploaded file, choosing the parser by filename extension. */
export const extractTextFromFile = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const ext = getExtension(filename);
  if (!ext) {
    throw new Error('Unsupported file type. Use .pdf, .docx, or .pptx');
  }

  return extractText(buffer, ext);
};
