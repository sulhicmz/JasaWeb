# JasaWeb Web Application

Astro-based marketing website for JasaWeb web development services.

## Overview

This is the public-facing website that showcases JasaWeb's web development services and includes:

- Marketing landing pages for service types
- Portfolio and case studies
- Blog and resources
- Contact forms and lead generation
- Client portal integration

## Tech Stack

- **Framework**: Astro
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Deployment**: Cloudflare Pages
- **TypeScript**: Full type safety
- **Testing**: Vitest for unit tests

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.15.0

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm cf-build` - Build for Cloudflare Pages
- `pnpm test` - Run unit tests
- `pnpm astro` - Run Astro CLI commands

### Development Server

The development server runs at:

```
http://localhost:4321
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── portal/          # Client portal components
│   └── knowledge-base/  # Knowledge base components
├── layouts/
│   ├── Layout.astro     # Base layout
│   └── DashboardLayout.astro # Portal layout
├── pages/
│   ├── dashboard/       # Client portal pages
│   ├── api/             # API routes
│   └── ...              # Static pages
├── services/
│   ├── analyticsService.ts
│   ├── knowledgeBaseService.ts
│   └── notificationService.ts
├── content/
│   ├── blog/            # Blog posts (MDX)
│   └── portfolio/       # Portfolio items
└── styles/
    └── global.css       # Global styles
```

## Key Features

### Marketing Site

- Service landing pages (School Websites, News Portals, Company Profiles)
- Portfolio showcase with case studies
- Blog and educational content
- Contact forms with lead capture
- SEO optimization

### Client Portal Integration

- Secure authentication flows
- Project dashboard embedded components
- Real-time notifications
- File upload and management interfaces

### Responsive Design

- Mobile-first approach
- Tailwind CSS utility classes
- Component-driven architecture
- Accessibility compliance

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `SITE_URL` - Website URL for SEO
- `API_BASE_URL` - Backend API endpoint
- `PUBLIC_ANALYTICS_ID` - Analytics tracking ID
- `CONTACT_EMAIL` - Contact form destination

## Styling

### Tailwind CSS

- Utility-first CSS framework
- Custom design tokens
- Responsive breakpoints
- Dark mode support

### Component Library

- shadcn/ui components
- Custom component overrides
- Consistent design system
- Type-safe props

## Content Management

### Blog Posts

Blog posts are stored as MDX files in `src/content/blog/`:

```mdx
---
title: 'Post Title'
description: 'Post description'
pubDate: 2024-01-01
tags: ['web-design', 'astro']
---

# Content here
```

### Portfolio Items

Portfolio pieces are stored in `src/content/portfolio/` with frontmatter for metadata.

## Testing

### Unit Tests

```bash
pnpm test
```

### Component Testing

```bash
pnpm test:ui
```

## Deployment

### Cloudflare Pages

```bash
pnpm cf-build
```

### Production Build

```bash
pnpm build
pnpm preview
```

### Environment Setup

- Production: Auto-deploy from main branch
- Staging: Auto-deploy from dev branch
- Preview: Deploy for each PR

## Performance

### Optimization

- Image optimization with Astro
- Bundle analysis and optimization
- Core Web Vitals monitoring
- CDN caching strategies

### Lighthouse Scores

- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to this project.

### Adding New Pages

1. Create Astro file in `src/pages/`
2. Use appropriate layout
3. Follow component patterns
4. Add to navigation if needed

### Component Development

1. Create in appropriate component directory
2. Use TypeScript interfaces
3. Include responsive design
4. Add accessibility attributes

## Support

For support, please contact:

- Create an issue in the GitHub repository
- Email: hello@jasaweb.com
