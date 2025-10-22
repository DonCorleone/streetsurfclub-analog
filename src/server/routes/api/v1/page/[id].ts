import { defineEventHandler, getRouterParam } from 'h3';
import { getBloggerApiData } from '../../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const pageId = getRouterParam(event, 'id');

  if (!pageId) {
    throw new Error('Missing page ID in path');
  }

  return getBloggerApiData(`/pages/${pageId}`, apiKey!, blogId!);
});
