import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { noteService } from '@/services/notes.service';

const schema = z.object({
  notebook_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  paper_style: z.enum(['blank', 'ruled', 'grid', 'dotted', 'cornell']).optional(),
  position: z.number().int().optional(),
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

  const note = await noteService.create(supabase, {
    user_id: user.id,
    ...parsed.data,
  });
  return NextResponse.json({ note });
}
