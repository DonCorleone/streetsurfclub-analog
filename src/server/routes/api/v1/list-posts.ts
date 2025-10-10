import { defineEventHandler, getQuery } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const mobile = query['mobile'] as string;
  let maxResults: string | number = query['maxResults'] as string;

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

  return getBloggerApiData('/posts', apiKey!, blogId!, {
    fetchImages: 'true',
    fetchBodies: 'false',
    maxResults: maxResults.toString(),
  });
});
