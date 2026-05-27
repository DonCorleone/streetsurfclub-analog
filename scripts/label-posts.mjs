/**
 * label-posts.mjs
 *
 * Fetches all Blogger posts, uses Claude Haiku to suggest labels, then
 * patches each post via the Blogger API v3.
 *
 * Usage:
 *   node scripts/label-posts.mjs              # dry-run: prints proposed changes
 *   node scripts/label-posts.mjs --write      # actually updates Blogger
 *   node scripts/label-posts.mjs --id=123456  # single post (dry-run)
 *   node scripts/label-posts.mjs --id=123456 --write
 *
 * Required .env vars:
 *   GOOGLE_BLOGGER_API_KEY     (read access)
 *   GOOGLE_BLOGGER_ID
 *   GOOGLE_OAUTH_CLIENT_ID     (write access — OAuth2)
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   ANTHROPIC_API_KEY
 *
 * On first --write run the script opens a browser for Google consent.
 * The refresh token is saved back to .env automatically.
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';

import Anthropic from '@anthropic-ai/sdk';
import { OAuth2Client } from 'google-auth-library';
import { JSDOM } from 'jsdom';

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '../.env');
const BLOGGER_API = 'https://www.googleapis.com/blogger/v3';
const OAUTH_REDIRECT = 'http://localhost:4242/oauth2callback';
const BATCH_SIZE = 10;       // posts per Claude call
const MAX_WORDS = 400;        // words sent to Claude per post
const MAX_LABELS = 6;         // labels per post
const HAIKU = 'claude-haiku-4-5-20251001';

// ─── Env loading ─────────────────────────────────────────────────────────────

async function loadEnvAsync() {
  if (!existsSync(ENV_PATH)) return {};
  const raw = await readFile(ENV_PATH, 'utf8');
  return Object.fromEntries(
    raw.split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        const val = l.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        return [l.slice(0, idx).trim(), val];
      })
  );
}

async function saveEnvKey(key, value) {
  let raw = existsSync(ENV_PATH) ? await readFile(ENV_PATH, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(raw)) {
    raw = raw.replace(regex, `${key}=${value}`);
  } else {
    raw = raw.trimEnd() + `\n${key}=${value}\n`;
  }
  await writeFile(ENV_PATH, raw, 'utf8');
}

// ─── HTML → plain text ───────────────────────────────────────────────────────

function htmlToText(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent ?? '';
}

function truncateWords(text, maxWords) {
  return text.split(/\s+/).slice(0, maxWords).join(' ');
}

// ─── Blogger API helpers ──────────────────────────────────────────────────────

async function fetchAllPosts(apiKey, blogId, targetId) {
  const posts = [];
  let pageToken = null;

  if (targetId) {
    const url = `${BLOGGER_API}/blogs/${blogId}/posts/${targetId}?key=${apiKey}&fields=id,title,content,labels`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Blogger API error: ${res.status} ${await res.text()}`);
    return [await res.json()];
  }

  do {
    const url = new URL(`${BLOGGER_API}/blogs/${blogId}/posts`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('fields', 'nextPageToken,items(id,title,content,labels)');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Blogger API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    posts.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? null;
    process.stdout.write(`\r  Fetched ${posts.length} posts…`);
  } while (pageToken);

  process.stdout.write('\n');
  return posts;
}

async function patchPostLabels(authClient, blogId, postId, labels) {
  const url = `${BLOGGER_API}/blogs/${blogId}/posts/${postId}`;
  const token = await authClient.getAccessToken();
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ labels }),
  });
  if (!res.ok) throw new Error(`PATCH failed for post ${postId}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── OAuth2 ──────────────────────────────────────────────────────────────────

async function runBrowserAuthFlow(client) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/blogger'],
  });

  console.log('\n🔐 Opening browser for Google OAuth consent…');
  console.log('   If it does not open, visit:\n  ', authUrl, '\n');
  openBrowser(authUrl);

  const code = await waitForOAuthCode();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  if (tokens.refresh_token) {
    await saveEnvKey('GOOGLE_OAUTH_REFRESH_TOKEN', tokens.refresh_token);
    console.log('✅ Refresh token saved to .env\n');
  } else {
    console.warn('⚠️  Google did not return a refresh token. Try revoking access at https://myaccount.google.com/permissions and re-running.\n');
  }

  return client;
}

async function getAuthClient(clientId, clientSecret, existingRefreshToken) {
  const client = new OAuth2Client(clientId, clientSecret, OAUTH_REDIRECT);

  if (existingRefreshToken) {
    client.setCredentials({ refresh_token: existingRefreshToken });

    // Eagerly test the token before starting the update loop
    try {
      await client.getAccessToken();
    } catch (err) {
      if (err.message?.includes('invalid_grant')) {
        console.warn('⚠️  Stored refresh token is invalid or expired — clearing it and re-authenticating…\n');
        await saveEnvKey('GOOGLE_OAUTH_REFRESH_TOKEN', '');
        return runBrowserAuthFlow(new OAuth2Client(clientId, clientSecret, OAUTH_REDIRECT));
      }
      throw err;
    }

    return client;
  }

  return runBrowserAuthFlow(client);
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

function waitForOAuthCode() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:4242');
      const code = url.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>✅ Authenticated! You can close this tab.</h2>');
      server.close();
      if (code) resolve(code);
      else reject(new Error('No code in OAuth callback'));
    });
    server.listen(4242, () => console.log('   Waiting for OAuth callback on http://localhost:4242…'));
    server.on('error', reject);
  });
}

// ─── Label extraction via Claude ─────────────────────────────────────────────

async function extractLabelsForBatch(anthropic, posts) {
  const items = posts.map(p => ({
    id: p.id,
    title: p.title,
    excerpt: truncateWords(htmlToText(p.content ?? ''), MAX_WORDS),
  }));

  const prompt = `You analyze blog posts from StreetSurfClub, a longboard and surfskate club based in Lucerne, Switzerland.

For each post below, suggest ${MAX_LABELS} concise, relevant labels. Rules:
- Match the language of the post (German or English)
- Use short, reusable terms (e.g. "Event", "Training", "Luzern", "Longboard", "Surfskate", "Wettkampf", "Video", "Reise", "Anfänger")
- Prefer specific over generic (e.g. "Downhill" over "Sport")
- No punctuation, no hashtags, capitalize first letter only
- Return ONLY valid JSON, no explanation

Posts:
${JSON.stringify(items, null, 2)}

Return JSON in this exact shape:
{
  "postId": ["Label1", "Label2", "Label3"]
}`;

  const message = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response (handle potential markdown code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude returned no JSON:\n${text}`);

  return JSON.parse(jsonMatch[0]);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--write');
  const targetId = args.find(a => a.startsWith('--id='))?.split('=')[1];

  const env = await loadEnvAsync();
  const API_KEY = env.GOOGLE_BLOGGER_API_KEY;
  const BLOG_ID = env.GOOGLE_BLOGGER_ID;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
  const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
  const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
  const REFRESH_TOKEN = env.GOOGLE_OAUTH_REFRESH_TOKEN;

  // Validation
  const missing = [];
  if (!API_KEY) missing.push('GOOGLE_BLOGGER_API_KEY');
  if (!BLOG_ID) missing.push('GOOGLE_BLOGGER_ID');
  if (!ANTHROPIC_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!isDryRun || targetId) {
    if (!CLIENT_ID) missing.push('GOOGLE_OAUTH_CLIENT_ID');
    if (!CLIENT_SECRET) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
  }
  if (missing.length) {
    console.error('❌ Missing .env vars:', missing.join(', '));
    process.exit(1);
  }

  console.log(`\n🏄 StreetSurfClub — Label Posts`);
  console.log(`   Mode: ${isDryRun ? '🔍 DRY-RUN (no changes written)' : '✏️  WRITE'}`);
  if (targetId) console.log(`   Target post: ${targetId}`);
  console.log('');

  // Fetch posts
  console.log('📥 Fetching posts from Blogger…');
  const allPosts = await fetchAllPosts(API_KEY, BLOG_ID, targetId);
  // Skip posts with no usable content (drafts, placeholder entries)
  const posts = allPosts.filter(p => p.title && htmlToText(p.title).trim());
  const skippedCount = allPosts.length - posts.length;
  console.log(`   ${posts.length} post(s) loaded${skippedCount ? ` (${skippedCount} empty skipped)` : ''}\n`);

  // Analyze with Claude in batches
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const labelMap = {};
  const batches = [];
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    batches.push(posts.slice(i, i + BATCH_SIZE));
  }

  console.log(`🤖 Analyzing with Claude Haiku (${batches.length} batch${batches.length > 1 ? 'es' : ''})…`);
  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`   Batch ${i + 1}/${batches.length}…`);
    const result = await extractLabelsForBatch(anthropic, batches[i]);
    Object.assign(labelMap, result);
    process.stdout.write(' ✓\n');
  }
  console.log('');

  // Show proposed changes
  console.log('📋 Proposed label changes:');
  console.log('─'.repeat(60));
  for (const post of posts) {
    const newLabels = labelMap[post.id] ?? [];
    const existingLabels = post.labels ?? [];
    const merged = [...new Set([...existingLabels, ...newLabels])];
    const added = merged.filter(l => !existingLabels.includes(l));

    console.log(`\n📝 ${htmlToText(post.title).trim()}`);
    if (existingLabels.length) {
      console.log(`   Existing : ${existingLabels.join(', ')}`);
    }
    console.log(`   Suggested: ${newLabels.join(', ')}`);
    if (added.length) {
      console.log(`   ➕ Adding : ${added.join(', ')}`);
    } else {
      console.log(`   ✓ No new labels`);
    }
    // Store merged labels back for write step
    post._mergedLabels = merged;
  }
  console.log('\n' + '─'.repeat(60));

  if (isDryRun) {
    console.log('\n✅ Dry-run complete. Run with --write to apply changes.\n');
    return;
  }

  // OAuth2 + write
  console.log('\n🔐 Authenticating with Google…');
  const authClient = await getAuthClient(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN);

  // Show which account is authenticated so the user can verify it's the blog owner
  try {
    const { token } = await authClient.getAccessToken();
    const infoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const info = await infoRes.json();
    console.log(`   Authenticated as: ${info.email}`);
    console.log('   ⚠️  Make sure this is the Blogger account that owns the blog.\n');
  } catch {
    // non-fatal, just skip the account display
  }

  console.log('📤 Updating posts in Blogger…');
  let updated = 0;
  let skipped = 0;
  for (const post of posts) {
    const merged = post._mergedLabels ?? [];
    const existing = post.labels ?? [];
    const hasChanges = merged.length !== existing.length
      || merged.some(l => !existing.includes(l));

    if (!hasChanges) {
      skipped++;
      continue;
    }

    const displayTitle = htmlToText(post.title).trim();
    process.stdout.write(`   Updating "${displayTitle}"…`);
    try {
      await patchPostLabels(authClient, BLOG_ID, post.id, merged);
    } catch (err) {
      if (err.message?.includes('403')) {
        process.stdout.write('\n');
        console.error(`\n❌ 403 Permission denied on post "${displayTitle}"`);
        console.error('   The authenticated Google account is not the owner of this blog.');
        console.error('   Fix: clear GOOGLE_OAUTH_REFRESH_TOKEN from .env and re-run --write,');
        console.error('   then sign in with the account that owns the Blogger blog.\n');
        process.exit(1);
      }
      throw err;
    }
    process.stdout.write(' ✓\n');
    updated++;

    // Polite rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Done — ${updated} updated, ${skipped} skipped (no changes)\n`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
