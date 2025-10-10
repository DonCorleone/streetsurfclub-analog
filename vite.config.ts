/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldPrerender = process.env?.['PRERENDER'] === 'true';
  const hasEnvVars = process.env?.['GOOGLE_BLOGGER_API_KEY'] && process.env?.['GOOGLE_BLOGGER_ID'];

  console.log('Build mode:', mode);
  console.log('Should prerender:', shouldPrerender);
  console.log('Has env vars:', hasEnvVars);

  // Define basic routes that should always be prerendered
  const basicRoutes = shouldPrerender ? ['/', '/blog'] : [];

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
            routes: basicRoutes,
            discover: true, // Auto-discover routes by crawling page links
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
