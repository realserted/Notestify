import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { noteService } from '@/services/notes.service';

const strokeSchema = z.object({
  id: z.string(),
  tool: z.enum(['pen', 'highlighter']),
  color: z.string(),
  size: z.number(),
  points: z.array(z.tuple([z.number(), z.number(), z.number()])),
});

const schema = z.object({
  title: z.string().max(200).optional(),
  paper_style: z.enum(['blank', 'ruled', 'grid', 'dotted', 'cornell']).optional(),
  content: z.unknown().optional(),
  strokes: z.array(strokeSchema).optional(),
  position: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const note = await noteService.update(supabase, id, parsed.data);
  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await noteService.remove(supabase, id);
  return NextResponse.json({ ok: true });
}
