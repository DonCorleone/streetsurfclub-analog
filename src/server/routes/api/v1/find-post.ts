import { defineEventHandler, getQuery, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const encodedQ = query['encodedQ'] as string;

  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables');
  }

  if (!encodedQ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing encodedQ parameter',
    });
  }

  const res = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/search?key=${apiKey}&fetchImages=true&q=${encodedQ}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
});
