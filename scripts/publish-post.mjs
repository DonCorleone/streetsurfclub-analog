/**
 * publish-post.mjs
 *
 * Orchestration script run as a Render one-off job after a new Blogger post
 * is published. Does three things in sequence:
 *
 *   1. Label the post via Claude Haiku + patch Blogger (label-posts.mjs --write)
 *   2. Regenerate prerender-routes.json from Blogger API
 *   3. Trigger a new deploy of the static site via Render deploy hook
 *
 * Usage (Render one-off job startCommand):
 *   node scripts/publish-post.mjs --id=<postId>
 *
 * Required env vars (inherited from base service on Render):
 *   GOOGLE_BLOGGER_API_KEY
 *   GOOGLE_BLOGGER_ID
 *   ANTHROPIC_API_KEY
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *   RENDER_DEPLOY_HOOK_URL     (Render Dashboard → static site → Settings → Deploy Hook)
 */

import { execSync } from 'child_process';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const postId = args.find(a => a.startsWith('--id='))?.split('=')[1];

if (!postId) {
  console.error('❌ Missing --id=<postId>');
  console.error('   Usage: node scripts/publish-post.mjs --id=1234567890');
  process.exit(1);
}

// ─── Env check ────────────────────────────────────────────────────────────────

const REQUIRED = [
  'GOOGLE_BLOGGER_API_KEY',
  'GOOGLE_BLOGGER_ID',
  'ANTHROPIC_API_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REFRESH_TOKEN',
  'RENDER_DEPLOY_HOOK_URL',
];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '));
  process.exit(1);
}

const DEPLOY_HOOK = process.env['RENDER_DEPLOY_HOOK_URL'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(label, cmd) {
  console.log(`\n▶  ${label}`);
  console.log(`   $ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: resolve(__dirname, '..') });
    console.log(`✅ ${label} done`);
  } catch (err) {
    console.error(`❌ ${label} failed (exit ${err.status})`);
    process.exit(err.status ?? 1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n🏄 StreetSurfClub — Publish Post Pipeline`);
console.log(`   Post ID: ${postId}`);
console.log('');

// Step 1: Label the post
run(
  'Label post via Claude Haiku',
  `node scripts/label-posts.mjs --id=${postId} --write`
);

// Step 2: Regenerate prerender routes
run(
  'Regenerate prerender routes',
  `node scripts/prerender-routes.mjs`
);

// Step 3: Trigger static site rebuild on Render
console.log('\n▶  Trigger static site deploy on Render');
try {
  const res = await fetch(DEPLOY_HOOK, { method: 'POST' });
  if (!res.ok) {
    console.error(`❌ Deploy hook failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const body = await res.json().catch(() => ({}));
  console.log(`✅ Deploy triggered — id: ${body.id ?? 'n/a'}`);
} catch (err) {
  console.error('❌ Deploy hook request failed:', err.message);
  process.exit(1);
}

console.log(`\n🎉 Pipeline complete for post ${postId}`);
console.log('   Labels applied, routes updated, site rebuilding.');
console.log('   Check Render dashboard for deploy progress.\n');
