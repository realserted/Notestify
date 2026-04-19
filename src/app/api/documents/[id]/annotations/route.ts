import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { annotationService } from '@/services/annotation.service';

const schema = z.object({
  page: z.number().int().min(1),
  kind: z.enum(['highlight', 'note', 'stroke']),
  data: z.unknown(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const annotation = await annotationService.create(supabase, {
    user_id: user.id,
    document_id: id,
    page: parsed.data.page,
    kind: parsed.data.kind,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: parsed.data.data as any,
  });
  return NextResponse.json({ annotation });
}
