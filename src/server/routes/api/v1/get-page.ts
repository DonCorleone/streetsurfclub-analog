import { defineEventHandler, getQuery, createError } from 'h3';
import { fetchWithRetry } from '../../../utils/retry';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const pageid = query['pageid'] as string;

  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables');
  }

  if (!pageid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing pageid parameter',
    });
  }

  const res = await fetchWithRetry(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/pages/${pageid}?key=${apiKey}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return res.json();
});
