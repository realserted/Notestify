import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { quizService } from '@/services/quiz.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreateQuizButton } from '@/components/quizzes/CreateQuizButton';

interface QuizRow {
  id: string;
  title: string;
  quiz_questions: { count: number }[];
  quiz_attempts: { count: number }[];
}

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const quizzes = (await quizService.list(supabase, user.id)) as QuizRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <CreateQuizButton />
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <p className="text-slate-500 dark:text-slate-400">No quizzes yet. Generate one with AI to begin.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle>{q.title}</CardTitle>
              </CardHeader>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {q.quiz_questions[0]?.count ?? 0} questions · {q.quiz_attempts[0]?.count ?? 0}{' '}
                attempts
              </p>
              <Link href={`/quizzes/${q.id}`}>
                <Button size="sm" variant="outline" className="w-full">
                  Take Quiz
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
