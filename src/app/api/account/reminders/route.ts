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

  const { error } = await supabase
    .from('profiles')
    .update({ daily_reminders: parsed.data.enabled })
    .eq('id', user.id);

  if (error) {
    console.error('[account/reminders]', error);
    return NextResponse.json({ error: 'Could not save that.' }, { status: 500 });
  }

  return NextResponse.json({ enabled: parsed.data.enabled });
}
