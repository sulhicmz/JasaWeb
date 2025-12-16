import type { APIRoute } from 'astro';
import { apiConfig } from '../config';

export const GET: APIRoute = () => {
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${apiConfig.siteUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow temporary/development paths
Disallow: /api/
Disallow: /_astro/
Disallow: /admin/

# Allow important bots
User-agent: Googlebot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
};
