import { defineEventHandler, getQuery, createError } from 'h3';
import { fetchWithRetry } from '../../../utils/retry';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const postid = query['postid'] as string;

  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables');
  }

  if (!postid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing postid parameter',
    });
  }

  const res = await fetchWithRetry(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${postid}?key=${apiKey}&fetchImages=true`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return res.json();
});
