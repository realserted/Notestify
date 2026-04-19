import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { notebookService } from '@/services/notes.service';

const schema = z.object({
  title: z.string().min(1).max(120),
  cover_color: z
    .enum(['coral', 'cream', 'ink', 'sage', 'sky', 'plum', 'butter'])
    .optional(),
});

export async function POST(req: NextRequest) {
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

  const notebook = await notebookService.create(supabase, {
    user_id: user.id,
    title: parsed.data.title,
    cover_color: parsed.data.cover_color,
  });
  return NextResponse.json({ notebook });
}
