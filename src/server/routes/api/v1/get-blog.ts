import { defineEventHandler } from 'h3';
import { getBloggerApiData } from '../../../utils/api-cache';

export default defineEventHandler(async (event) => {
  const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
  const blogId = process.env['GOOGLE_BLOGGER_ID'];

  return getBloggerApiData('', apiKey!, blogId!);
});
