/**
 * POST /api/v1/publish-post
 *
 * Validates the publish secret, then creates a Render one-off job that runs
 * scripts/publish-post.mjs --id=<postId> on the base web service.
 *
 * Required env vars:
 *   PUBLISH_SECRET          — shared secret checked against ?key= query param
 *   RENDER_API_KEY          — Render API key (Dashboard → Account → API Keys)
 *   RENDER_SERVICE_ID       — base service ID (srv-d3k1q163jp1c73aml110)
 *
 * Body (JSON):
 *   { "postId": "1234567890" }
 *   OR
 *   { "postUrl": "https://www.streetsurfclub.ch/..." }   ← ID extracted server-side
 */

import { defineEventHandler, getQuery, readBody, createError, getRequestHeader } from 'h3';

const RENDER_JOBS_API = 'https://api.render.com/v1/services';

function extractPostId(postUrl: string): string | null {
  // Blogger post URLs contain the numeric post ID as the last path segment
  // e.g. https://www.blogger.com/blog/post/edit/123456/7890123456789
  // or   https://streetsurfclub.blogspot.com/.../post-slug.html?m=1
  // The Blogger *edit* URL is the most reliable source:
  // https://www.blogger.com/blog/post/edit/<blogId>/<postId>
  const editMatch = postUrl.match(/\/blog\/post\/edit\/\d+\/(\d+)/);
  if (editMatch) return editMatch[1];

  // Fallback: look for any long numeric segment (Blogger IDs are ~19 digits)
  const numericMatch = postUrl.match(/\/(\d{10,})/);
  if (numericMatch) return numericMatch[1];

  return null;
}

export default defineEventHandler(async (event) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const PUBLISH_SECRET = process.env['PUBLISH_SECRET'];
  if (!PUBLISH_SECRET) {
    throw createError({ statusCode: 500, statusMessage: 'PUBLISH_SECRET not configured' });
  }

  const providedKey = getRequestHeader(event, 'authorization')?.replace('Bearer ', '');

  if (!providedKey || providedKey !== PUBLISH_SECRET) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  // ── Render config ─────────────────────────────────────────────────────────
  const RENDER_API_KEY = process.env['RENDER_API_KEY'];
  const RENDER_SERVICE_ID = process.env['RENDER_SERVICE_ID'];

  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
    throw createError({ statusCode: 500, statusMessage: 'Render API not configured' });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = await readBody(event);
  let postId: string | null = body?.postId ?? null;

  if (!postId && body?.postUrl) {
    postId = extractPostId(body.postUrl);
  }

  if (!postId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide postId or postUrl in request body',
    });
  }

  // ── Create one-off job on Render ──────────────────────────────────────────
  const jobUrl = `${RENDER_JOBS_API}/${RENDER_SERVICE_ID}/jobs`;
  const startCommand = `node scripts/publish-post.mjs --id=${postId}`;

  const res = await fetch(jobUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startCommand }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Render API error ${res.status}:`, text);
    throw createError({
      statusCode: 502,
      statusMessage: `Render API error: ${res.status}`,
    });
  }

  const job = await res.json();

  return {
    ok: true,
    postId,
    jobId: job.id,
    startCommand,
    message: `Pipeline started. Check Render dashboard for job ${job.id}.`,
  };
});
