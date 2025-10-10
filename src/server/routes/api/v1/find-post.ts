import { defineEventHandler, getQuery, createError } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const encodedQ = query['encodedQ'] as string;

  if (!encodedQ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing encodedQ parameter',
    });
  }

  return getBloggerApiData('/posts/search', apiKey!, blogId!, {
    fetchImages: 'true',
    q: encodedQ,
  });
});
