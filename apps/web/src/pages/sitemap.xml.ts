import type { APIRoute from 'astro';

const SITE_URL = 'https://jasaweb.id';

export const GET: APIRoute = async () => {
  try {
    // Static pages with proper priorities and update frequencies
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/services', priority: 0.9, changefreq: 'monthly' },
      { url: '/portfolio', priority: 0.8, changefreq: 'weekly' },
      { url: '/blog', priority: 0.8, changefreq: 'weekly' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
      { url: '/login', priority: 0.5, changefreq: 'monthly' },
    ];

    // Dynamic pages (would typically come from CMS)
    const dynamicPages = [];
    
    try {
      // Try to get blog posts and portfolio items if collections exist
      const { getCollection } = await import('astro:content');
      
      // Add blog posts
      const blogPosts = await getCollection('blog').catch(() => []);
      blogPosts.forEach(post => {
        dynamicPages.push({
          url: `/blog/${post.slug}`,
          priority: 0.6,
          changefreq: 'monthly',
          lastmod: post.data.updatedDate || post.data.pubDate
        });
      });

      // Add portfolio projects
      const portfolioProjects = await getCollection('portfolio').catch(() => []);
      portfolioProjects.forEach(project => {
        dynamicPages.push({
          url: `/portfolio/${project.slug}`,
          priority: 0.6,
          changefreq: 'monthly',
          lastmod: project.data.updatedDate || project.data.pubDate
        });
      });
    } catch (error) {
      // Collections not available, continue with static pages only
      console.log('Content collections not available, using static pages only');
    }

    const allPages = [...staticPages, ...dynamicPages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod ? new Date(page.lastmod).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${page.url === '' ? `
    <xhtml:link rel="alternate" hreflang="id" href="${SITE_URL}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />` : ''}
  </url>`
    )
    .join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error) {
    // Fallback sitemap with static pages only
    const fallbackPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/services', priority: 0.9, changefreq: 'monthly' },
      { url: '/portfolio', priority: 0.8, changefreq: 'weekly' },
      { url: '/blog', priority: 0.8, changefreq: 'weekly' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${fallbackPages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }
};
