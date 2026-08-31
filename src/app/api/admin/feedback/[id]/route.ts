import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/admin';

const schema = z.object({
  status: z.enum(['new', 'triaged', 'done', 'wont_fix']).optional(),
  admin_note: z.string().max(4000).nullable().optional(),
});

/**
 * Triage a feedback row.
 *
 * Deliberately uses the caller's own client, not the admin client: the RLS
 * policy already restricts updates to admins, so Postgres enforces this even
 * if the check below were wrong. Reaching for the service role key here would
 * remove that safety net for no gain.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feedback')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[admin/feedback] patch', error);
    return NextResponse.json({ error: 'Could not save that.' }, { status: 400 });
  }

  return NextResponse.json({ feedback: data });
}
