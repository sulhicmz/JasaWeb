# JasaWeb

Platform jasa pembuatan website profesional (Web Sekolah, Portal Berita, Company Profile).

## Tech Stack

- **Frontend**: Astro + React
- **Backend**: Cloudflare Workers (via Astro API Routes)
- **Database**: Neon PostgreSQL + Prisma ORM
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Payment**: Midtrans QRIS
- **Hosting**: Cloudflare Pages

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run development server
pnpm dev
```

## Documentation

- [Blueprint & Features](docs/architecture/blueprint.md)
- [Roadmap](docs/architecture/roadmap.md)
- [Cloudflare Setup](docs/deployment/SETUP.md)

## Project Structure

```
├── prisma/              # Database schema
├── public/              # Static assets
├── src/
│   ├── layouts/         # Astro layouts
│   ├── lib/             # Utilities & services
│   ├── pages/           # Routes & API
│   └── components/      # React components
├── docs/                # Documentation
└── wrangler.toml        # Cloudflare config
```

## License

MIT
