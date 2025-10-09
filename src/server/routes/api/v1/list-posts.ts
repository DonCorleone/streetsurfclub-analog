import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const mobile = query['mobile'] as string;
  let maxResults: string | number = query['maxResults'] as string;

  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables');
  }

  if (maxResults === '-1') {
    if (mobile === 'true') {
      maxResults = process.env['BLOG_MAX_RESULTS_MOBILE'] || '50';
    } else {
      maxResults = process.env['BLOG_MAX_RESULTS'] || '300';
    }
  }
  
  if (!maxResults) {
    maxResults = '300';
  }

  const res = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&fetchImages=true&fetchBodies=false&maxResults=${maxResults}`,
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
