import { defineEventHandler, getQuery } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];
  const query = getQuery(event);
  const postId = query['postid'] as string;

  if (!postId) {
    throw new Error('Missing postid parameter');
  }

  return getBloggerApiData(`/posts/${postId}`, apiKey!, blogId!, {
    fetchImages: 'true',
  });
});
