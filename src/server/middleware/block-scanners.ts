import { defineEventHandler, setResponseStatus, getRequestURL, send } from 'h3';

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  const blocked =
    path.endsWith('.php') ||
    path.includes('wp-') ||
    path.includes('xmlrpc') ||
    path.includes('.env') ||
    path.includes('/.git');

  if (blocked) {
    setResponseStatus(event, 404);
    await send(event, 'Not found');
  }
});