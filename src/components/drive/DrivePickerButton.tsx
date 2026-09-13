'use client';

import { useCallback, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/Button';
import { PICKER_MIME_TYPES } from '@/lib/drive/formats';
import type { Document } from '@/types/database';

/**
 * Opens the Google Picker and imports whatever the user chooses.
 *
 * Selection happens entirely inside Google's own UI. We never list or browse
 * Drive — with the drive.file scope we could not, which is the point: Google
 * only grants us the files a user hands over through this dialog.
 */

interface PickedDoc {
  id: string;
  name: string;
  mimeType: string;
}

interface PickerResponse {
  action: string;
  docs?: PickedDoc[];
}

interface Props {
  onImported: (doc: Document) => void;
  /** False until the user has connected Drive in Settings. */
  connected: boolean;
}

export const DrivePickerButton = ({ onImported, connected }: Props) => {
  const [apiReady, setApiReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadPicker = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.gapi?.load('picker', () => setApiReady(true));
  }, []);

  const importFile = useCallback(
    async (doc: PickedDoc) => {
      setBusy(true);
      setError('');

      const res = await fetch('/api/drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: doc.id, name: doc.name, mimeType: doc.mimeType }),
      });

      setBusy(false);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'Could not import that file.');
        return;
      }

      const { document } = await res.json();
      onImported(document as Document);
    },
    [onImported]
  );

  const open = useCallback(async () => {
    setError('');
    setBusy(true);

    // Mint a fresh access token per open. They last an hour and the Picker
    // needs one in the browser; refresh tokens never leave the server.
    const res = await fetch('/api/drive/connection', { method: 'POST' });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Could not reach Google Drive.');
      return;
    }

    const { accessToken } = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const picker = (window as any).google.picker;

    const view = new picker.DocsView()
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      // Unsupported types are not selectable, so a user cannot pick a
      // spreadsheet and then be told no. The server re-checks regardless —
      // the Picker is a client and cannot be trusted.
      .setMimeTypes(PICKER_MIME_TYPES);

    new picker.PickerBuilder()
      .setAppId(process.env.NEXT_PUBLIC_GOOGLE_APP_ID)
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY)
      .addView(view)
      .setCallback((data: PickerResponse) => {
        if (data.action === picker.Action.PICKED && data.docs?.[0]) {
          void importFile(data.docs[0]);
        }
      })
      .build()
      .setVisible(true);
  }, [importFile]);

  if (!connected) return null;

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" onLoad={loadPicker} />

      <Button
        size="sm"
        variant="outline"
        disabled={!apiReady}
        loading={busy}
        onClick={open}
        type="button"
      >
        Pick from Drive
      </Button>

      {error && (
        <p className="mt-2 text-sm font-semibold text-clay-500 dark:text-clay-300">{error}</p>
      )}
    </>
  );
};
