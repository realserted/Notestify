import { redirect } from 'next/navigation';
import { Flame, BookOpen, Layers, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { dashboardService } from '@/services/dashboard.service';
import { Card } from '@/components/ui/Card';

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: number | string;
}) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className="rounded-md bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stats = await dashboardService.getStats(supabase, user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Day streak" value={stats.streak} />
        <StatCard icon={Clock} label="Due today" value={stats.dueToday} />
        <StatCard icon={Layers} label="Total decks" value={stats.totalDecks} />
        <StatCard icon={BookOpen} label="Total flashcards" value={stats.totalFlashcards} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Recent quiz attempts</h3>
          {stats.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No attempts yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentAttempts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between border-b border-slate-100 py-2 text-sm dark:border-slate-800"
                >
                  <span>{new Date(a.completed_at).toLocaleDateString()}</span>
                  <span className="font-medium">{a.score}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Weak topics</h3>
          {stats.weakTopics.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Take a quiz to see insights.</p>
          ) : (
            <ul className="space-y-2">
              {stats.weakTopics.map((t) => (
                <li
                  key={t.deck_id}
                  className="flex justify-between border-b border-slate-100 py-2 text-sm dark:border-slate-800"
                >
                  <span>{t.deck_title}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{t.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
