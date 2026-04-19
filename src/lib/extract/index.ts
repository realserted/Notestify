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

export const extractTextFromFile = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const ext = getExtension(filename);
  if (!ext) {
    throw new Error('Unsupported file type. Use .pdf, .docx, or .pptx');
  }

  if (ext === 'pdf') {
    return extractTextFromPDF(buffer);
  }

  if (ext === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  const ast = await parseOffice(buffer);
  return ast.toText().trim();
};
