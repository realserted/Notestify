import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ enabled: z.boolean() });

/** Turn daily study reminders on or off for the signed-in user. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Upsert rather than update. A profile row can be missing if the
  // handle_new_user trigger failed when the account was created, and an
  // UPDATE matching zero rows is reported by Supabase as a success — so the
  // preference silently never saved. Upserting makes the route self-healing.
  //
  // .select() so a write that somehow still matches nothing is a real error.
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        daily_reminders: parsed.data.enabled,
      },
      { onConflict: 'id' }
    )
    .select('daily_reminders')
    .single();

  if (error || !data) {
    console.error('[account/reminders]', error);
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 });
  }

  return NextResponse.json({ enabled: data.daily_reminders });
}
