import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { annotationService } from '@/services/annotation.service';
import { PdfAnnotator } from '@/components/annotations/PdfAnnotator';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentAnnotatorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, title, user_id, mime_type')
    .eq('id', id)
    .single();
  if (error || !doc || doc.user_id !== user.id) notFound();
  if (doc.mime_type && !doc.mime_type.includes('pdf')) {
    return (
      <div className="rounded-xl border border-cream-200 p-6 text-sm dark:border-ink-700">
        Annotation is PDF-only right now. Upload a PDF to annotate it.
      </div>
    );
  }

  const annotations = await annotationService.listByDocument(supabase, id);

  return (
    <PdfAnnotator
      documentId={id}
      documentTitle={doc.title}
      initialAnnotations={annotations}
    />
  );
}
