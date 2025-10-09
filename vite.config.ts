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
          // Disable prerendering during normal builds to avoid API call issues
          prerender: {
            routes: shouldPrerender && hasEnvVars ? ['/', '/blog'] : [],
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
