/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldPrerender = process.env?.['PRERENDER'] === 'true';
  const hasEnvVars = process.env?.['GOOGLE_BLOGGER_API_KEY'] && process.env?.['GOOGLE_BLOGGER_ID'];

  console.log('Build mode:', mode);
  console.log('Should prerender:', shouldPrerender);
  console.log('Has env vars:', hasEnvVars);

  // Define basic routes that should always be prerendered
  const basicRoutes = shouldPrerender ? ['/', '/blog'] : [];

  // Try to load prerender-routes.json if it exists
  let prerenderRoutes = basicRoutes;
  if (shouldPrerender) {
    const prerenderRoutesPath = resolve(__dirname, 'prerender-routes.json');
    if (existsSync(prerenderRoutesPath)) {
      try {
        const file = readFileSync(prerenderRoutesPath, 'utf-8');
        const parsed = JSON.parse(file);
        if (Array.isArray(parsed) && parsed.length > 0) {
          prerenderRoutes = parsed;
          console.log(`Loaded ${parsed.length} prerender routes from prerender-routes.json`);
        }
      } catch (e) {
        console.warn('Could not parse prerender-routes.json:', e);
      }
    }
  }

  return {
    build: {
      target: ['es2020'],
    },
    resolve: {
      mainFields: ['module'],
    },
    plugins: [
      analog({
        nitro: {
          preset: 'node-server',
          serveStatic: true,
        },
        // Prerender configuration when PRERENDER=true
        ...(shouldPrerender && {
          prerender: {
            routes: prerenderRoutes,
            // discover: true, // Disabled to avoid crawling invalid dynamic routes
            ...(hasEnvVars && {
              sitemap: {
                host: 'https://streetsurfclub.ch',
              },
            }),
          },
        }),
      }),
      tailwindcss()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
