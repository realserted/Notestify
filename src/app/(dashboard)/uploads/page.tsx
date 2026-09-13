import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UploadManager } from '@/components/uploads/UploadManager';
import { getConnection } from '@/lib/drive/connection';
import type { Document } from '@/types/database';

export default async function UploadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const driveConnection = await getConnection(supabase);

  return (
    <UploadManager
      initialDocuments={(documents ?? []) as Document[]}
      driveConnected={driveConnection !== null}
    />
  );
}
