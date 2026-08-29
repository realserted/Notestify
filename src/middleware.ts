import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

export const middleware = (request: NextRequest) => updateSession(request);

// Only the routes that actually need a session decision. Everything else —
// the landing page, /api/*, static assets — skips middleware entirely.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/decks/:path*',
    '/documents/:path*',
    '/notes/:path*',
    '/quizzes/:path*',
    '/settings/:path*',
    '/uploads/:path*',
    '/tutor/:path*',
    '/login/:path*',
    '/register/:path*',
  ],
};
