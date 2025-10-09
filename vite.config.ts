/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
// @ts-ignore - .mjs file without types
import { generateRoutes } from './scripts/generate-routes.mjs';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const shouldPrerender = process.env?.['PRERENDER'] === 'true';
  const hasEnvVars = process.env?.['GOOGLE_BLOGGER_API_KEY'] && process.env?.['GOOGLE_BLOGGER_ID'];

  console.log('Build mode:', mode);
  console.log('Should prerender:', shouldPrerender);
  console.log('Has env vars:', hasEnvVars);

  // Generate routes dynamically if prerendering is enabled
  const prerenderRoutes = shouldPrerender && hasEnvVars ? await generateRoutes() : [];

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
          // Prerender all pages and posts when PRERENDER=true
          prerender: {
            routes: prerenderRoutes,
            crawlLinks: false,
            failOnError: false, // Don't fail build if prerender fails
          },
        },
        // Optional sitemap generation
        ...(hasEnvVars && {
          sitemap: {
            host: 'https://streetsurfclub.ch',
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
