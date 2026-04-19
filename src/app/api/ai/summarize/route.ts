import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateSummary } from '@/lib/ai/service';

const schema = z.object({
  content: z.string().min(20),
  document_id: z.string().uuid().optional(),
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

  try {
    const summary = await generateSummary(parsed.data.content);
    if (parsed.data.document_id) {
      await supabase
        .from('documents')
        .update({ summary })
        .eq('id', parsed.data.document_id)
        .eq('user_id', user.id);
    }
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[ai/summarize]', error);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}
