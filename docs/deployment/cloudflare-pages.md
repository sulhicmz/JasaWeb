# Cloudflare Pages Deployment Guide

This guide explains how to deploy the JasaWeb marketing site to Cloudflare Pages.

## Prerequisites

1. Cloudflare account
2. Access to the JasaWeb GitHub repository
3. Proper environment variables configured in Cloudflare Pages dashboard

## Deployment Configuration

### Build Settings

- **Build command**: `pnpm build:web`
- **Build output directory**: `apps/web/dist`
- **Root directory**: `/` (default)

### Environment Variables

The following environment variables should be set in the Cloudflare Pages dashboard:

```bash
# Site Configuration
SITE_URL=https://your-domain.com
SITE_NAME=JasaWeb
SITE_DESCRIPTION=Professional Web Development Services

# Analytics (optional)
GOOGLE_ANALYTICS_ID=
GOOGLE_TAG_MANAGER_ID=

# Contact Form
CONTACT_EMAIL=contact@jasaweb.com
```

## Custom Routes Configuration

The `_routes.json` file is automatically generated during the build process to optimize Cloudflare Pages routing:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*", "/_astro/*"]
}
```

This configuration ensures that:
- All static assets are served directly by Cloudflare CDN
- API routes are properly excluded (handled by the client portal API)
- Astro assets are served efficiently

## Build Process

The Cloudflare Pages build process:

1. Runs `pnpm install` to install dependencies
2. Executes `pnpm build:web` to build the Astro site
3. Generates the `_routes.json` file for optimal routing
4. Deploys the contents of `apps/web/dist` to Cloudflare's edge network

## Preview Deployments

Preview deployments are automatically created for each pull request. These deployments:

- Use the same build configuration as production
- Are accessible via unique preview URLs
- Have access to the same environment variables as production (unless overridden)

## Troubleshooting

### Build Failures

Common causes of build failures:

1. **Dependency issues**: Ensure all dependencies are properly listed in `package.json`
2. **Environment variables**: Check that all required environment variables are set
3. **Build command**: Verify the build command is correct (`pnpm build:web`)

### Performance Issues

To optimize performance:

1. Use Cloudflare's automatic asset optimization
2. Enable Brotli compression
3. Configure proper caching headers
4. Use Cloudflare's image optimization for images

## Advanced Configuration

### Custom Domains

To configure custom domains:

1. Add your domain in the Cloudflare Pages dashboard
2. Update your DNS records as instructed
3. Configure SSL certificates (automatically provisioned by Cloudflare)

### Redirects

To set up redirects, create a `_redirects` file in the `apps/web/public` directory:

```
/home      /
/blog      /blog/latest
/projects  /portfolio  301
```

### Headers

To set custom headers, create a `_headers` file in the `apps/web/public` directory:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

## Monitoring

Cloudflare Pages provides built-in monitoring:

- Deployment status and logs
- Performance metrics
- Visitor analytics
- Error tracking

For more detailed monitoring, consider integrating with:

- Cloudflare Analytics
- Third-party monitoring services
- Custom logging solutions