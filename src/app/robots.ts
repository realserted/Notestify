import type { MetadataRoute } from 'next';
import { SITE_URL } from './layout';

/**
 * Everything behind auth redirects to /login for a crawler anyway, but saying
 * so explicitly stops Google spending crawl budget on it and keeps odd URLs
 * out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/mobile-captcha',
        '/auth/',
        '/admin',
        '/dashboard',
        '/decks',
        '/documents',
        '/notes',
        '/quizzes',
        '/search',
        '/settings',
        '/tutor',
        '/uploads',
        '/unsubscribe',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
