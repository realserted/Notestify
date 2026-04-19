import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: doc, error } = await supabase
    .from('documents')
    .select('storage_path, user_id, title')
    .eq('id', id)
    .single();
  if (error || !doc || doc.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 3600);
  if (signErr || !signed) {
    return NextResponse.json({ error: 'Could not sign URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, title: doc.title });
}
