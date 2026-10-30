import { defineEventHandler } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

/**
 * Dedicated endpoint for the "main" banner post.
 * Avoids query-param issues with the Analog SSR interceptor (ofetch URLSearchParams spread bug).
 */
export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];

  return getBloggerApiData('/posts', apiKey!, blogId!, {
    fetchImages: 'true',
    labels: 'main',
  });
});
