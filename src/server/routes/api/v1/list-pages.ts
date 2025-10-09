import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];

  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables');
  }

  const res = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/pages?key=${apiKey}&fetchBodies=false`,
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
