import { defineEventHandler, getRouterParam } from 'h3';
import { getBloggerApiData } from '../../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const postId = getRouterParam(event, 'id');

  if (!postId) {
    throw new Error('Missing post ID in path');
  }

  return getBloggerApiData(`/posts/${postId}`, apiKey!, blogId!);
});
