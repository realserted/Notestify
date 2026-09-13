'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface DriveConnectionView {
  googleEmail: string | null;
  connectedAt: string;
  scopeStale: boolean;
}

interface Props {
  connection: DriveConnectionView | null;
  /** From ?drive= on the OAuth callback's redirect. */
  notice?: string;
}

const NOTICES: Record<string, string> = {
  connected: 'Google Drive connected.',
  cancelled: 'Drive connection cancelled.',
  failed: 'Could not connect Google Drive. Please try again.',
  badstate: 'That connection link expired. Please start again.',
};

export const DriveConnectionCard = ({ connection, notice }: Props) => {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  const disconnect = async () => {
    setWorking(true);
    await fetch('/api/drive/connection', { method: 'DELETE' });
    setWorking(false);
    // The page read the connection server-side, so without this the card keeps
    // showing a connection that no longer exists until a hard reload.
    router.refresh();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="text-[19px]">Google Drive</CardTitle>
          <p className="mt-2 max-w-prose text-sm text-bark-700 dark:text-foam-50/75">
            Import a document straight from Drive instead of downloading and re-uploading it.
            Notestify can only ever see the files you pick — it cannot browse or list your Drive.
            The file itself is never stored; we read the text and discard the rest.
          </p>

          {connection && (
            <p className="mt-3 text-[13px] font-semibold text-bark-500 dark:text-bark-300">
              Connected{connection.googleEmail ? ` as ${connection.googleEmail}` : ''} ·{' '}
              {new Date(connection.connectedAt).toLocaleDateString()}
            </p>
          )}

          {connection?.scopeStale && (
            <p className="mt-2 text-sm font-semibold text-clay-500 dark:text-clay-300">
              This connection was granted different permissions than Notestify now uses.
              Reconnect to refresh it.
            </p>
          )}

          {notice && NOTICES[notice] && (
            <p className="mt-3 text-sm font-semibold text-citrus-600 dark:text-citrus-500">
              {NOTICES[notice]}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {connection ? (
            <Button size="sm" variant="outline" loading={working} onClick={disconnect}>
              Disconnect
            </Button>
          ) : (
            // A plain link, not fetch: this starts a top-level OAuth redirect
            // to Google, which cannot happen from inside an XHR.
            <a href="/api/drive/connect">
              <Button size="sm" variant="outline">
                Connect
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};
