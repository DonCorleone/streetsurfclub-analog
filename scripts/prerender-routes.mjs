// scripts/prerender-routes.mjs
// Run this script before build to generate a JSON file with all routes for prerendering
import { generateRoutes } from './generate-routes.mjs';
import { writeFile } from 'fs/promises';

const OUTPUT = new URL('../prerender-routes.json', import.meta.url);

const routes = await generateRoutes();
await writeFile(OUTPUT, JSON.stringify(routes, null, 2));
console.log(`✅ Wrote prerender routes to ${OUTPUT.pathname}`);
