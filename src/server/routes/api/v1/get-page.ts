import { defineEventHandler, getQuery } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const pageId = query['pageid'] as string;

  if (!pageId) {
    throw new Error('Missing pageid parameter');
  }

  return getBloggerApiData(`/pages/${pageId}`, apiKey!, blogId!);
});
