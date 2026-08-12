import { defineEventHandler, setResponseStatus, getRequestURL, send } from 'h3';

const ALLOWED_PREFIXES = [
  '/api/',
  '/blog',
  '/publish',
  '/_analog/',   // Analog/Nitro interne Assets
  '/assets/',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  const allowed =
    path === '/' ||
    ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));

  if (!allowed) {
    setResponseStatus(event, 404);
    await send(event, 'Not found');
  }
});