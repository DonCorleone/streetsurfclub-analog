/**
 * Prerender Routes Generator
 * 
 * This script generates a list of all blog post routes for SSG pre-rendering.
 * Run this before building for production to ensure all blog posts are pre-rendered.
 * 
 * Usage: node scripts/generate-routes.mjs
 */

const GOOGLE_BLOGGER_API_KEY = process.env.GOOGLE_BLOGGER_API_KEY;
const GOOGLE_BLOGGER_ID = process.env.GOOGLE_BLOGGER_ID;
const BLOG_MAX_RESULTS = process.env.BLOG_MAX_RESULTS || '300';

async function generateRoutes() {
  if (!GOOGLE_BLOGGER_API_KEY || !GOOGLE_BLOGGER_ID) {
    console.warn('⚠️  Missing API credentials. Skipping route generation.');
    console.warn('   Set GOOGLE_BLOGGER_API_KEY and GOOGLE_BLOGGER_ID in .env');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${GOOGLE_BLOGGER_ID}/posts?key=${GOOGLE_BLOGGER_API_KEY}&maxResults=${BLOG_MAX_RESULTS}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.items || [];

    // Generate routes for all blog posts
    const routes = [
      '/',
      '/blog',
      ...posts.map(post => `/blog/blog-details/${post.id}`)
    ];

    console.log(`✅ Generated ${routes.length} routes for pre-rendering:`);
    console.log(`   - Homepage: /`);
    console.log(`   - Blog list: /blog`);
    console.log(`   - Blog posts: ${posts.length} posts`);

    return routes;
  } catch (error) {
    console.error('❌ Error generating routes:', error.message);
    return ['/', '/blog']; // Fallback to basic routes
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRoutes().then(routes => {
    console.log('\nRoutes:', JSON.stringify(routes, null, 2));
  });
}

export { generateRoutes };
