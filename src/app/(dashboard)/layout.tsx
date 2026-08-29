import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/lib/supabase/server';
import { dashboardService } from '@/services/dashboard.service';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates these routes; if there is somehow no user, render
  // the shell without a streak rather than throwing.
  const streak = user ? await dashboardService.getStreak(supabase, user.id) : 0;

  return <DashboardShell streak={streak}>{children}</DashboardShell>;
}
