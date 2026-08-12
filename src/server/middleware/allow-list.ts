import { defineEventHandler, setResponseStatus, getRequestURL, send } from 'h3';

const ALLOWED_PREFIXES = [
  '/api/v1/',
  '/blog/blog-details/',
  '/_analog/',
  '/assets/',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

const ALLOWED_EXACT = [
  '/',
  '/blog',
  '/publish',
  '/analog-welcome',
];

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  const allowed =
    ALLOWED_EXACT.includes(path) ||
    ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));

  if (!allowed) {
    setResponseStatus(event, 404);
    await send(event, 'Not found');
  }
});