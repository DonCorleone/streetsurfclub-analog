---
name: label-posts
description: Run the AI labeling pipeline for StreetSurfClub Blogger posts. Fetches all posts, sends batches to Claude Haiku to suggest labels, merges with existing labels, then optionally patches Blogger via OAuth2. Also covers the automated publish pipeline triggered from the /publish admin page. Use when the user wants to regenerate, refresh, or update post labels in Google Blogger, or when working on the publish pipeline.
---

# Label Posts — AI Labeling Pipeline

Scripts: `scripts/label-posts.mjs` · `scripts/publish-post.mjs`
API: `src/server/routes/api/v1/publish-post.ts`
UI: `src/app/pages/publish.page.ts`

---

## Automated Publish Pipeline (Content Creator Flow)

Zero-CLI. Content creator bookmarks one URL, pastes Blogger post URL, clicks button.

```
/publish?key=<PUBLISH_SECRET>  (publish.page.ts)
  → POST /api/v1/publish-post?key=<secret>  { postUrl }
  → publish-post.ts: validates key, extracts post ID, calls Render Jobs API
  → Render one-off job on srv-d3k1q163jp1c73aml110:
      node scripts/publish-post.mjs --id=<postId>
        1. node scripts/label-posts.mjs --id=<postId> --write
        2. node scripts/prerender-routes.mjs
        3. POST RENDER_DEPLOY_HOOK_URL
```

Duration: ~5–10 min end-to-end.

### Env vars (Render Dashboard → streetsurfclub-analog → Environment)

| Var | Purpose |
|---|---|
| `PUBLISH_SECRET` | Secret key in bookmarked URL |
| `RENDER_API_KEY` | Render Account → API Keys |
| `RENDER_SERVICE_ID` | `srv-d3k1q163jp1c73aml110` |
| `RENDER_DEPLOY_HOOK_URL` | Service Settings → Deploy Hook |
| `ANTHROPIC_API_KEY` | Claude Haiku |
| `GOOGLE_BLOGGER_API_KEY` | Blogger read access |
| `GOOGLE_BLOGGER_ID` | Blog ID |
| `GOOGLE_OAUTH_CLIENT_ID` | Blogger write (OAuth2) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Blogger write (OAuth2) |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Auto-saved on first local --write run |

### Post URL formats accepted

- Blogger edit URL: `https://www.blogger.com/blog/post/edit/<blogId>/<postId>` ← most reliable
- Published URL: numeric ID extracted from path automatically

---

## Manual CLI Commands (local dev / bulk re-label)

Requires `.env` at project root with vars above (except `PUBLISH_SECRET`, `RENDER_*`).

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

OAuth2 setup (one-time, local):
1. Create OAuth2 credentials in Google Cloud Console
2. Add `http://localhost:4242/oauth2callback` as authorized redirect URI
3. First `--write` run opens browser for Google consent
4. Refresh token auto-saved to `.env`

---

## Label Pipeline Flow

```
1. Fetch posts from Blogger API (paginated, 50/page)
   └─ fields: id, title, content, labels

2. Filter: skip posts with empty title/content

3. Batch (10/batch) → Claude Haiku (claude-haiku-4-5-20251001)
   └─ suggest ≤8 labels per post
   └─ rules: language match, specificity, banned terms

4. Post-process
   └─ LABEL_RENAME: normalize casing/spelling
   └─ LABEL_DELETE: remove noise
   └─ TITLE_GUARDED_LABELS: Gioasteka / Firestarter / Weltmeisterschaft
      only added when post title contains event name

5. Merge: existing (cleaned) + suggested → deduped, max 20

6. Dry-run: print diff  OR  Write: PATCH Blogger API (300ms delay)
```

---

## Label Rules

- Match post language (German or English)
- Short reusable terms, capitalize first letter only, no punctuation/hashtags
- Banned: Blog, News, Post, Update, StreetSurfClub, SSC, Lucerne, Luzern, Switzerland, Schweiz, Anfänger

**Canonical situation labels:**

| Label | Trigger |
|---|---|
| `Downhill` | downhill racing, open road or closed track |
| `Pumptrack` | pumptrack / skateparks |
| `Cruising` | cruising / carving in groups |
| `Surfskate-Montag` | weekly surfskate meetup Emmen |
| `Dienstags-Cruise` | weekly tuesday cruise Obernau / Kriens |
| `Verein` | club matters, GV, Jahresversammlung |
| `Pass` | mountain passes (Gotthard, Furka, Susten…) |
| `Freeride` | freeride / closed-track downhill |
| `Open Road` | downhill on open mountain roads |
| `Firestarter` | primarily about Firestarter event |
| `Gioasteka` | primarily about Gioasteka event |
| `Weltmeisterschaft` | World Championship |

**Label renames (applied to existing + suggested):**

| From | To |
|---|---|
| FireStarter | Firestarter |
| Openroad | Open Road |
| WM | Weltmeisterschaft |
| Skater Of The Month / Skater des Monats | Skater of the Month |
| Gravity Plate | Gravityplate |
| Equipment | Ausrüstung |
| Vereinstreffen / Versammlung / Club | Verein |
| Generalversammlung | GV |
| Medienbericht / Medienberichterstattung | Medien |
| Cruise | Cruising |
| Webseite | Website |

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Missing env vars` on Render | Check Render Dashboard env vars — all 10 required vars present? |
| `403 Permission denied` | Wrong Google account. Clear `GOOGLE_OAUTH_REFRESH_TOKEN`, re-run `--write` locally, sign in as blog owner. |
| `invalid_grant` | Refresh token expired. Script auto-clears and re-opens browser auth. |
| `Claude returned no JSON` | Transient Haiku issue. Re-run. |
| Render job not starting | Check `RENDER_API_KEY` + `RENDER_SERVICE_ID` correct. |

---

## Modifying Label Rules

All in `scripts/label-posts.mjs`:

- `LABEL_RENAME` line ~48 — add rename mappings
- `LABEL_DELETE` line ~68 — add labels to purge
- `TITLE_GUARDED_LABELS` line ~385 — event labels requiring title match
- `extractLabelsForBatch()` line ~264 — edit Claude prompt
- `BATCH_SIZE` line ~41 — posts per Claude call (default 10)
- `MAX_LABELS` line ~43 — max labels per post (default 8)
- `MAX_WORDS` line ~42 — words sent to Claude per post (default 4700)
