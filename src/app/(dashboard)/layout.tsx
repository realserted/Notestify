import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/lib/supabase/server';
import { dashboardService } from '@/services/dashboard.service';
import { isAdmin } from '@/lib/auth/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates these routes; if there is somehow no user, render
  // the shell empty rather than throwing.
  const [streak, dueCount] = user
    ? await Promise.all([
        dashboardService.getStreak(supabase, user.id),
        dashboardService.getDueCount(supabase, user.id),
      ])
    : [0, 0];

  return (
    <DashboardShell streak={streak} dueCount={dueCount} admin={isAdmin(user)}>
      {children}
    </DashboardShell>
  );
}
