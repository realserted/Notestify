import type { SupportedExtension } from '@/lib/extract';

/**
 * Which Drive MIME types we accept, how to get their bytes, and which parser
 * reads them.
 *
 * One table answers all three questions, which matters because the third —
 * rejecting unsupported types — stops being a separate check somebody can
 * forget. Anything absent here is refused before a single Drive call.
 */

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export interface DriveFormat {
  /**
   * Non-null means files.export to this type; null means files.get?alt=media.
   *
   * Native Google formats have no bytes to download — files.get returns 403
   * for them — so a Doc or Slides deck must be exported. This is the single
   * most likely thing a student picks, so it is not an edge case.
   */
  exportAs: string | null;
  format: SupportedExtension;
}

const FORMATS: Record<string, DriveFormat> = {
  // Native Google formats — must be exported.
  'application/vnd.google-apps.document': { exportAs: DOCX_MIME, format: 'docx' },
  'application/vnd.google-apps.presentation': { exportAs: PPTX_MIME, format: 'pptx' },

  // Files merely stored in Drive — downloaded as-is.
  'application/pdf': { exportAs: null, format: 'pdf' },
  [DOCX_MIME]: { exportAs: null, format: 'docx' },
  [PPTX_MIME]: { exportAs: null, format: 'pptx' },

  // Deliberately absent: Google Sheets (exports to XLSX, which no parser here
  // reads), images, video, and legacy .doc/.ppt, which mammoth and
  // officeparser cannot handle either.
};

/**
 * hasOwn, not `FORMATS[mimeType] ?? null`.
 *
 * mimeType comes from the request body, and a plain index walks the prototype
 * chain — so "constructor" or "toString" would return a truthy Object.prototype
 * member, sail through the supported-type gate, and reach the extractor with
 * an undefined format.
 */
export const resolveDriveFormat = (mimeType: string): DriveFormat | null =>
  Object.hasOwn(FORMATS, mimeType) ? FORMATS[mimeType] : null;

/**
 * Passed to the Picker so unsupported files are not selectable in the first
 * place. Rejecting after the fact still has to work — the Picker is a client
 * and cannot be trusted — but it is a poor way to find out.
 */
export const PICKER_MIME_TYPES = Object.keys(FORMATS).join(',');
