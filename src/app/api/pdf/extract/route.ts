import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromPDF } from '@/lib/pdf/extract';

const schema = z.object({
  document_id: z.string().uuid(),
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
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', parsed.data.document_id)
      .eq('user_id', user.id)
      .single();
    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await supabase.from('documents').update({ status: 'processing' }).eq('id', doc.id);

    const { data: fileBlob, error: dlError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);
    if (dlError || !fileBlob) throw dlError ?? new Error('Download failed');

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const extracted = await extractTextFromPDF(buffer);

    await supabase
      .from('documents')
      .update({ extracted_text: extracted, status: 'ready' })
      .eq('id', doc.id);

    return NextResponse.json({ text: extracted });
  } catch (error) {
    console.error('[pdf/extract]', error);
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', parsed.data.document_id);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
