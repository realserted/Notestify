import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TutorChat } from '@/components/tutor/TutorChat';

export default async function TutorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <TutorChat />;
}
