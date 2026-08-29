import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Permanently deletes the signed-in user's account.
 *
 * Every table carries `on delete cascade` against auth.users, so removing the
 * auth user clears the database. Storage objects do NOT cascade, so the
 * user's folder in the documents bucket is emptied first — otherwise the
 * files would be orphaned with no owner left to delete them.
 */
const schema = z.object({
  // Typed by the user in the UI. Guards against a mis-click and against a
  // CSRF-style request that could not know the address.
  confirm_email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmation required.' }, { status: 400 });
  }

  if (parsed.data.confirm_email.trim().toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return NextResponse.json(
      { error: 'That email does not match this account.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    // 1. Storage first. If this fails we stop, because once the auth user is
    //    gone we would have no way to find the files again.
    const { data: files, error: listError } = await admin.storage
      .from('documents')
      .list(user.id, { limit: 1000 });

    if (listError) throw listError;

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      const { error: removeError } = await admin.storage.from('documents').remove(paths);
      if (removeError) throw removeError;
    }

    // 2. Then the auth user, which cascades to every table.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    // 3. Clear the session cookies on the way out.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[account/delete]', error);
    return NextResponse.json(
      { error: 'Could not delete the account. Please contact support.' },
      { status: 500 }
    );
  }
}
