---
name: label-posts
description: Run the AI labeling pipeline for StreetSurfClub Blogger posts. Fetches all posts, sends batches to Claude Haiku to suggest labels, merges with existing labels, then optionally patches Blogger via OAuth2. Also covers the automated publish pipeline triggered from the /publish admin page. Use when the user wants to regenerate, refresh, or update post labels in Google Blogger, or when working on the publish pipeline.
---

# Label Posts — AI Labeling Pipeline

Scripts: `scripts/label-posts.mjs` · `scripts/publish-post.mjs`
API: `src/server/routes/api/v1/publish-post.ts`
UI: `src/app/pages/publish.page.ts`

Fetches Blogger posts → Claude Haiku suggests labels → merges with existing → patches Blogger API.

---

## Automated Publish Pipeline (Content Creator Flow)

Zero-CLI flow for non-technical content creators:

```
1. Publish post in Blogger
2. Open bookmarked URL: https://streetsurfclub.ch/publish?key=<PUBLISH_SECRET>
3. Paste Blogger post URL → click "Veröffentlichen"
4. Done — pipeline runs automatically (~5–10 min)
```

### What happens under the hood

```
/publish page (publish.page.ts)
  → POST /api/v1/publish-post?key=<secret>  { postUrl }
  → publish-post.ts validates key, extracts post ID, calls Render API
  → Render creates one-off job on srv-d3k1q163jp1c73aml110
  → job runs: node scripts/publish-post.mjs --id=<postId>
      1. node scripts/label-posts.mjs --id=<postId> --write
      2. node scripts/prerender-routes.mjs
      3. POST RENDER_DEPLOY_HOOK_URL  (triggers static site rebuild)
```

### Required env vars (set in Render Dashboard)

| Var | Purpose |
|---|---|
| `PUBLISH_SECRET` | Secret key in bookmarked URL |
| `RENDER_API_KEY` | Render API key (Account → API Keys) |
| `RENDER_SERVICE_ID` | `srv-d3k1q163jp1c73aml110` |
| `RENDER_DEPLOY_HOOK_URL` | Static site deploy hook (service Settings → Deploy Hook) |
| `ANTHROPIC_API_KEY` | Claude Haiku access |
| `GOOGLE_OAUTH_CLIENT_ID` | Blogger write access |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Blogger write access |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Auto-saved on first OAuth run |

### Bookmarked URL for content creator

```
https://streetsurfclub.ch/publish?key=<value of PUBLISH_SECRET>
```

Content creator bookmarks this once. Never needs to know what the key is.

### Post URL format accepted

The `/publish` page accepts any Blogger URL containing the post ID:
- Blogger edit URL: `https://www.blogger.com/blog/post/edit/<blogId>/<postId>` ← most reliable
- Published post URL: also works (numeric ID extracted from path)

---

---

## Prerequisites

All vars must be in `.env` at project root:

```bash
GOOGLE_BLOGGER_API_KEY=      # read access (API key)
GOOGLE_BLOGGER_ID=           # blog ID
ANTHROPIC_API_KEY=           # Claude Haiku access
GOOGLE_OAUTH_CLIENT_ID=      # write access (OAuth2)
GOOGLE_OAUTH_CLIENT_SECRET=  # write access (OAuth2)
GOOGLE_OAUTH_REFRESH_TOKEN=  # auto-saved on first --write run
```

OAuth2 setup (one-time):
1. Create OAuth2 credentials in Google Cloud Console
2. Add `http://localhost:4242/oauth2callback` as authorized redirect URI
3. On first `--write` run, browser opens for Google consent
4. Refresh token auto-saved to `.env`

---

## Commands

```bash
# Dry-run all posts (safe — no writes)
node scripts/label-posts.mjs

# Apply labels to all posts
node scripts/label-posts.mjs --write

# Dry-run single post
node scripts/label-posts.mjs --id=<postId>

# Apply labels to single post
node scripts/label-posts.mjs --id=<postId> --write
```

---

## Pipeline Flow

```
1. Fetch all posts from Blogger API (paginated, 50/page)
   └─ fields: id, title, content, labels

2. Filter: skip posts with no title/content

3. Batch posts (10 per batch) → Claude Haiku
   └─ Prompt: suggest ≤8 labels per post
   └─ Rules enforced in prompt (language, specificity, banned terms)
   └─ Model: claude-haiku-4-5-20251001

4. Post-process suggested labels
   └─ LABEL_RENAME: normalize casing/spelling
   └─ LABEL_DELETE: remove noise labels
   └─ TITLE_GUARDED_LABELS: "Gioasteka", "Firestarter", "Weltmeisterschaft"
      only added if post title contains the event name

5. Merge: existing (cleaned) + suggested → deduped, max 20 labels

6. Dry-run: print diff (existing / removing / suggested / adding)
   OR
   Write: PATCH each changed post via Blogger API (OAuth2)
   └─ 300ms delay between patches (rate limiting)
```

---

## Label Rules (enforced in Claude prompt)

- Match post language (German or English)
- Short, reusable terms — prefer specific over generic
- Capitalize first letter only, no punctuation, no hashtags
- **Banned labels**: Blog, News, Post, Update, StreetSurfClub, SSC, Lucerne, Luzern, Switzerland, Schweiz, Anfänger

**Canonical situation labels** (add when applicable):

| Label | When |
|---|---|
| `Downhill` | downhill longboarding / racing, open road or closed track |
| `Pumptrack` | pumptrack or skateparks |
| `Cruising` | cruising / carving in groups |
| `Surfskate-Montag` | weekly surfskate meetup in Emmen |
| `Dienstags-Cruise` | weekly tuesday cruise in Obernau / Kriens |
| `Verein` | club matters, members, GV, Jahresversammlung |
| `Pass` | mountain passes (Gotthard, Furka, Susten…) |
| `Freeride` | freeride or closed-track downhill events |
| `Open Road` | downhill on open roads in mountains |
| `Firestarter` | primarily about Firestarter event |
| `Gioasteka` | primarily about Gioasteka freeride event |
| `Weltmeisterschaft` | World Championship posts |

---

## Label Normalization Reference

**Renames applied** (existing + suggested):

| From | To |
|---|---|
| FireStarter | Firestarter |
| Openroad | Open Road |
| WM | Weltmeisterschaft |
| Skater Of The Month | Skater of the Month |
| Skater des Monats | Skater of the Month |
| Gravity Plate | Gravityplate |
| Equipment | Ausrüstung |
| Vereinstreffen / Versammlung / Club | Verein |
| Generalversammlung | GV |
| Medienbericht / Medienberichterstattung | Medien |
| Cruise | Cruising |
| Webseite | Website |

**Deleted labels** (noise/clutter — see `LABEL_DELETE` set in script for full list):
Location noise (`Luzern`), generic meta (`Update`, `Advanced`), year-specific event variants (`FireStarter 06`…`10`), photo album labels (`Neue Bilder`), single-occurrence unrelated labels.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `403 Permission denied` | Wrong Google account authenticated. Clear `GOOGLE_OAUTH_REFRESH_TOKEN` from `.env`, re-run `--write`, sign in as blog owner. |
| `invalid_grant` | Refresh token expired. Script auto-clears it and re-opens browser auth. |
| `Claude returned no JSON` | Haiku response malformed. Re-run — transient. |
| Missing `.env` vars | Script exits with list of missing keys before doing anything. |

---

## Modifying Label Rules

All rules live in `scripts/label-posts.mjs`:

- **`LABEL_RENAME`** (line ~48): add rename mappings
- **`LABEL_DELETE`** (line ~68): add labels to purge
- **`TITLE_GUARDED_LABELS`** (line ~385): event labels that require title match
- **`extractLabelsForBatch()`** (line ~264): edit Claude prompt for new rules
- **`BATCH_SIZE`** (line ~41): posts per Claude call (default 10)
- **`MAX_LABELS`** (line ~43): max labels per post (default 8)
- **`MAX_WORDS`** (line ~42): words sent to Claude per post (default 4700)
