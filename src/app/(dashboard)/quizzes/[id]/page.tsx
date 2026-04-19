import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { quizService } from '@/services/quiz.service';
import { QuizRunner } from '@/components/quizzes/QuizRunner';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const quiz = await quizService.getWithQuestions(supabase, id);
  return <QuizRunner quiz={quiz} />;
}
