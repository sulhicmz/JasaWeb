import type { APIRoute } from 'astro';

const SITE_URL = import.meta.env.SITE_URL || 'https://jasaweb.id';

export const GET: APIRoute = () => {
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

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
