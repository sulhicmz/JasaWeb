# Tailwind CSS Migration Documentation

## Migration Summary

This document confirms the successful migration from the deprecated `@astrojs/tailwind` integration to the native Tailwind CSS Vite plugin.

## Migration Details

### Previous Setup (Deprecated)

- **Integration**: `@astrojs/tailwind` v5.1.5
- **Configuration**: Astro integration in `astro.config.mjs`
- **Status**: Deprecated as of Tailwind CSS v4

### Current Setup (Recommended)

- **Plugin**: `@tailwindcss/vite` v4.1.17
- **Tailwind CSS**: v4.1.17
- **Configuration**: Native Vite plugin in `astro.config.mjs`
- **CSS Import**: `@import 'tailwindcss'` in `global.css`

## Configuration Files

### `apps/web/astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  // ... other config
  vite: {
    plugins: [tailwindcss()],
    // ... other vite config
  },
  integrations: [react()],
});
```

### `apps/web/src/styles/global.css`

```css
/* Tailwind CSS v4 import */
@import 'tailwindcss';

/* Custom styles */
body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
}

.container {
  @apply max-w-6xl mx-auto;
}

/* Additional custom styles... */
```

### `apps/web/package.json`

```json
{
  "dependencies": {
    "@tailwindcss/vite": "^4.1.17",
    "tailwindcss": "^4.1.17"
  }
}
```

## Benefits of Migration

1. **Performance**: Native Vite plugin provides better build performance
2. **Compatibility**: Full compatibility with Tailwind CSS v4 features
3. **Maintenance**: Active development and support from Tailwind CSS team
4. **Future-Proof**: Aligned with Tailwind CSS roadmap

## Verification

The migration has been verified by:

- ✅ Successful build process
- ✅ No deprecated dependencies
- ✅ Proper CSS compilation
- ✅ Working development server
- ✅ No breaking changes in existing styles

## Migration Date

Completed: November 16, 2025

## Related Issues

- GitHub Issue #142: Migrate Tailwind CSS integration to native Vite plugin
- Dependabot PR #126: deps(deps): bump @astrojs/tailwind from 5.1.5 to 6.0.2
