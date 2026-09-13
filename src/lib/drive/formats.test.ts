import { describe, it, expect } from 'vitest';
import { resolveDriveFormat, PICKER_MIME_TYPES, DOCX_MIME, PPTX_MIME } from './formats';

describe('drive format resolution', () => {
  it('exports native Google formats rather than downloading them', () => {
    // files.get?alt=media returns 403 for these — they have no bytes to
    // download. Getting this wrong breaks the most common thing a student
    // picks, while working fine for an uploaded PDF in testing.
    const doc = resolveDriveFormat('application/vnd.google-apps.document');
    expect(doc?.exportAs).toBe(DOCX_MIME);
    expect(doc?.format).toBe('docx');

    const slides = resolveDriveFormat('application/vnd.google-apps.presentation');
    expect(slides?.exportAs).toBe(PPTX_MIME);
    expect(slides?.format).toBe('pptx');
  });

  it('downloads files that are merely stored in Drive', () => {
    expect(resolveDriveFormat('application/pdf')).toEqual({ exportAs: null, format: 'pdf' });
    expect(resolveDriveFormat(DOCX_MIME)).toEqual({ exportAs: null, format: 'docx' });
    expect(resolveDriveFormat(PPTX_MIME)).toEqual({ exportAs: null, format: 'pptx' });
  });

  it('rejects types no parser can read', () => {
    // Sheets export to XLSX, which nothing here reads. Legacy .doc/.ppt are
    // not handled by mammoth or officeparser either.
    expect(resolveDriveFormat('application/vnd.google-apps.spreadsheet')).toBeNull();
    expect(resolveDriveFormat('application/vnd.ms-excel')).toBeNull();
    expect(resolveDriveFormat('application/msword')).toBeNull();
    expect(resolveDriveFormat('image/png')).toBeNull();
    expect(resolveDriveFormat('video/mp4')).toBeNull();
    expect(resolveDriveFormat('application/vnd.google-apps.folder')).toBeNull();
  });

  it('rejects unknown and empty types rather than guessing', () => {
    expect(resolveDriveFormat('')).toBeNull();
    expect(resolveDriveFormat('application/octet-stream')).toBeNull();
  });

  it('does not resolve inherited object properties', () => {
    // A plain-object lookup would happily return Object.prototype members for
    // a mimeType of "constructor" or "toString", which a client controls.
    expect(resolveDriveFormat('constructor')).toBeNull();
    expect(resolveDriveFormat('toString')).toBeNull();
    expect(resolveDriveFormat('__proto__')).toBeNull();
  });

  it('offers the Picker exactly the types the server accepts', () => {
    // If these drift, a user can pick something the server then refuses.
    for (const mime of PICKER_MIME_TYPES.split(',')) {
      expect(resolveDriveFormat(mime)).not.toBeNull();
    }
  });
});
