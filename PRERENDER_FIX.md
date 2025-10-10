# Prerendering Rate Limiting Fix

## Problem Analysis

The deployment logs showed rate limiting issues (HTTP 429 errors) during the prerendering process:

```
❌ Error generating routes: Pages API request failed: Too Many Requests
[request error] [unhandled] [GET] http://localhost/api/v1/get-blog
 H3Error: HTTP error! status: 429
```

The root causes were:

1. **Duplicate API calls**: The custom `generateRoutes()` script was making API calls during build configuration, then API routes were making additional calls during prerendering
2. **No rate limiting protection**: API routes had no retry mechanisms or delays between requests
3. **No caching**: Each API call hit Google's Blogger API directly without any caching
4. **Unnecessary complexity**: Custom route generation when Analog.js provides built-in solutions

## Solution Overview

### 1. Replaced Custom Route Generation with Analog.js Built-ins

**Before**: Custom `generateRoutes.mjs` script that fetched all posts during build configuration
**After**: Use Analog.js built-in `discover: true` (crawlLinks) feature

```typescript
// vite.config.ts - NEW APPROACH
export default defineConfig(({ mode }) => {
  const shouldPrerender = process.env?.['PRERENDER'] === 'true';
  const basicRoutes = shouldPrerender ? ['/', '/blog'] : [];

  return {
    plugins: [
      analog({
        ...(shouldPrerender && {
          prerender: {
            routes: basicRoutes,
            discover: true, // Auto-discover routes by crawling page links
            sitemap: {
              host: 'https://streetsurfclub.ch',
            },
          },
        }),
      }),
    ],
  };
});
```

**Benefits**:
- ✅ No duplicate API calls during build configuration
- ✅ Analog.js handles route discovery automatically by crawling links
- ✅ Simpler configuration
- ✅ Only basic routes (/, /blog) are defined statically

### 2. Implemented API Caching and Retry Layer

Created `src/server/utils/api-cache.ts` with:

**In-Memory Caching**:
- 5-minute TTL for API responses
- Prevents duplicate requests during prerendering
- Automatic cache expiration

**Exponential Backoff Retry**:
- Up to 3 retries for rate-limited requests (429) and server errors (5xx)
- Exponential delays: 2s → 4s → 8s (max 30s)
- Immediate failure for client errors (4xx)

**Request Spacing**:
- Automatic delays between API requests
- Respects Google's rate limits

### 3. Updated All API Routes

All API routes now use the new `getBloggerApiData()` utility:

```typescript
// Before
export default defineEventHandler(async (event) => {
  const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
});

// After  
export default defineEventHandler(async (event) => {
  return getBloggerApiData('/posts', apiKey!, blogId!, {
    fetchImages: 'true',
  });
});
```

**Updated Routes**:
- ✅ `/api/v1/get-blog`
- ✅ `/api/v1/list-posts` 
- ✅ `/api/v1/list-pages`
- ✅ `/api/v1/get-post`
- ✅ `/api/v1/get-page`
- ✅ `/api/v1/find-post`

## How This Solves the Rate Limiting

### During Build Time
1. **No API calls in vite.config.ts**: Route generation is handled by Analog.js crawling
2. **Only basic routes defined**: `['/', '/blog']` - no API calls needed

### During Prerendering
1. **Caching prevents duplicates**: First request caches response for 5 minutes
2. **Retry logic handles 429s**: Exponential backoff automatically retries rate-limited requests
3. **Request spacing**: Built-in delays between requests respect API limits
4. **Auto-discovery**: Analog.js crawls links from `/` and `/blog` to find blog post routes

### Expected Behavior
```
Build mode: production
Should prerender: true
Has env vars: true

✅ Prerendering routes:
   - / (static route)
   - /blog (static route)
   - /blog/blog-details/post/123 (discovered via crawling)
   - /blog/blog-details/post/456 (discovered via crawling)
   - ... (more routes discovered automatically)

[API Cache] Hit for /posts - no additional API call
[API Request] Attempt 1/4: /posts/123
[API Success] /posts/123
[API Cache] Hit for /posts/123 - cached response used
```

## Deployment Instructions

1. **Set Environment Variables**:
   ```bash
   PRERENDER=true
   GOOGLE_BLOGGER_API_KEY=your-key
   GOOGLE_BLOGGER_ID=your-blog-id
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   ```

3. **Verify Success**:
   - No more 429 errors in logs
   - Successful prerendering of discovered routes
   - Cached API responses logged
   - Retry logic working for any temporary failures

## Alternative Approach (If Needed)

If crawling doesn't work perfectly, you can still use static route lists without API calls:

```typescript
prerender: {
  routes: [
    '/',
    '/blog',
    // Add specific post routes manually if needed
    '/blog/blog-details/post/123',
    '/blog/blog-details/post/456',
  ],
}
```

This approach gives you full control while still benefiting from the caching and retry mechanisms.

## Files Modified

- ✅ `vite.config.ts` - Simplified prerender configuration
- ✅ `src/server/utils/api-cache.ts` - New caching and retry utility
- ✅ `src/server/routes/api/v1/*.ts` - All API routes updated
- ✅ `scripts/generate-routes.mjs` - No longer needed (can be removed)

The solution eliminates the root cause of rate limiting while making the system more robust and maintainable.