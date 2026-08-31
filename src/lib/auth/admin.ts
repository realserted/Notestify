import type { User } from '@supabase/supabase-js';

/**
 * Whether the signed-in user is an admin.
 *
 * Reads `app_metadata`, never `user_metadata`. Users can write to
 * user_metadata themselves through supabase.auth.updateUser() — the register
 * page does exactly that for full_name — so a role stored there could be
 * self-granted. app_metadata is only writable with the service role key.
 *
 * This gates the UI and the routes. The real boundary is the RLS policy on
 * public.feedback, which Postgres enforces regardless of what the app does.
 */
export const isAdmin = (user: User | null): boolean =>
  user?.app_metadata?.role === 'admin';
