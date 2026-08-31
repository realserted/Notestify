import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const schema = z.object({
  kind: z.enum(['bug', 'idea', 'other']),
  message: z.string().trim().min(1).max(4000),
  /** Route the user was on. The single most useful field on a bug report. */
  path: z.string().max(300).optional(),
  viewport: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = await checkRateLimit(supabase, 'feedback');
  if (!limit.allowed) return rateLimitResponse('feedback', limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please write a message first.' }, { status: 400 });
  }

  // Gathered server-side so the client cannot spoof it, and so the deployed
  // commit is recorded rather than whatever the browser claims.
  const context = {
    path: parsed.data.path ?? null,
    viewport: parsed.data.viewport ?? null,
    user_agent: req.headers.get('user-agent')?.slice(0, 400) ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
  };

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    kind: parsed.data.kind,
    message: parsed.data.message,
    context,
  });

  if (error) {
    console.error('[feedback]', error);
    return NextResponse.json({ error: 'Could not send that. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
