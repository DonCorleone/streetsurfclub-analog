// scripts/prerender-routes.mjs
// Run this script before build to generate a JSON file with all routes for prerendering
import { config } from 'dotenv';
import { generateRoutes } from './generate-routes.mjs';
import { writeFile } from 'fs/promises';

// Load .env from project root
config({ path: new URL('../.env', import.meta.url).pathname });

const OUTPUT = new URL('../prerender-routes.json', import.meta.url);

const routes = await generateRoutes();
await writeFile(OUTPUT, JSON.stringify(routes, null, 2));
console.log(`✅ Wrote prerender routes to ${OUTPUT.pathname}`);
