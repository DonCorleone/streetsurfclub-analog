import { defineEventHandler, getQuery, createError } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const labels = query['labels'] as string;

  if (!labels) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing labels parameter',
    });
  }

  return getBloggerApiData('/posts', apiKey!, blogId!, {
    fetchImages: 'true',
    labels,
  });
});
