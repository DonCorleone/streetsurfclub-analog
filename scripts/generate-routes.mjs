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
    // Fetch ALL posts for full static site generation
    const postsUrl = `https://www.googleapis.com/blogger/v3/blogs/${GOOGLE_BLOGGER_ID}/posts?key=${GOOGLE_BLOGGER_API_KEY}&maxResults=${BLOG_MAX_RESULTS}`;
    console.log(`🔄 Fetching all posts (max ${BLOG_MAX_RESULTS})...`);
    const postsResponse = await fetch(postsUrl);
    if (!postsResponse.ok) {
      throw new Error(`Posts API request failed: ${postsResponse.statusText}`);
    }
    const postsData = await postsResponse.json();
    const posts = postsData.items || [];
    console.log(`✅ Fetched ${posts.length} posts`);

    // Fetch all pages (usually just a few static pages)
    console.log(`🔄 Fetching all pages...`);
    const pagesUrl = `https://www.googleapis.com/blogger/v3/blogs/${GOOGLE_BLOGGER_ID}/pages?key=${GOOGLE_BLOGGER_API_KEY}`;
    const pagesResponse = await fetch(pagesUrl);
    if (!pagesResponse.ok) {
      throw new Error(`Pages API request failed: ${pagesResponse.statusText}`);
    }
    const pagesData = await pagesResponse.json();
    const pages = pagesData.items || [];
    console.log(`✅ Fetched ${pages.length} pages`);

    // Generate routes for CRITICAL pages only:
    // - Homepage and blog listing (always needed)
    // - All static pages (few and important)
    // - Latest 10 blog posts (for SEO and quick loading)
    // Older posts will be server-rendered on-demand (still works without JS!)
    const latestPosts = posts.slice(0, 10);

    const routes = [
      '/',
      '/blog',
      ...latestPosts.map(post => `/blog/blog-details/post/${post.id}`),
      ...pages.map(page => `/blog/blog-details/page/${page.id}`)
    ];

    console.log(`\n✅ Generated ${routes.length} routes for pre-rendering:`);
    console.log(`   - Homepage: /`);
    console.log(`   - Blog list: /blog`);
    console.log(`   - Latest posts: ${latestPosts.length} posts (prerendered)`);
    console.log(`   - Static pages: ${pages.length} pages (prerendered)`);
    console.log(`   - Older posts: ${posts.length - latestPosts.length} posts (server-rendered on-demand)`);
    console.log(`   - 🎯 All pages work without JavaScript via SSR!`);

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
