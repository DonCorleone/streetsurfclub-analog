# 🚀 Deployment Guide - Street Surf Club Analog.js

## Prerequisites

- Node.js 20.x or higher
- Google Blogger API credentials
- Git repository with your code

## Environment Variables Required

Set these in your hosting provider:

```bash
GOOGLE_BLOGGER_API_KEY=your-api-key-here
GOOGLE_BLOGGER_ID=your-blog-id-here
BLOG_MAX_RESULTS=300
BLOG_MAX_RESULTS_MOBILE=50
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Quick Deploy
```bash
npm install -g vercel
vercel login
vercel
```

#### Configuration Steps:
1. **Connect Repository**: Link your Git repository to Vercel
2. **Framework Preset**: Select "Other" or "Vite"
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist/analog/public`
5. **Install Command**: `npm install`

#### Environment Variables in Vercel:
1. Go to **Project Settings** → **Environment Variables**
2. Add each variable:
   - `GOOGLE_BLOGGER_API_KEY` (Sensitive)
   - `GOOGLE_BLOGGER_ID`
   - `BLOG_MAX_RESULTS`
   - `BLOG_MAX_RESULTS_MOBILE`
3. Select **All** environments (Production, Preview, Development)
4. Click **Save**

#### Vercel Deployment Config (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "analog",
  "outputDirectory": "dist/analog/public"
}
```

---

### Option 2: Netlify

#### Quick Deploy:
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

#### Configuration Steps:
1. **Connect Repository**: Link your Git repository
2. **Build Command**: `npm run build`
3. **Publish Directory**: `dist/analog/public`
4. **Node Version**: 20

#### Environment Variables in Netlify:
1. Go to **Site Settings** → **Environment Variables**
2. Add each variable with their values
3. Click **Save**

#### Netlify Config (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist/analog/public"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: Cloudflare Pages

#### Quick Deploy:
1. Connect your Git repository to Cloudflare Pages
2. **Build Command**: `npm run build`
3. **Build Output Directory**: `dist/analog/public`
4. **Environment Variables**: Add in Pages settings

#### Configuration:
- **Framework Preset**: None
- **Node Version**: 20
- **Build Command**: `npm run build`
- **Output**: `dist/analog/public`

---

## Local Production Testing

### Build and Test Locally:
```bash
# Build for production
npm run build

# Preview the production build
npm run preview

# Or start the production server directly
node dist/analog/server/index.mjs
```

### Test Pre-rendering:
```bash
# Generate routes for all blog posts
node scripts/generate-routes.mjs

# Verify output in dist/analog/public/
ls -la dist/analog/public/
```

---

## Post-Deployment Checklist

### ✅ Required Tests:

1. **Homepage Load**
   - [ ] Visit `/` - Should load immediately (SSG)
   - [ ] Check meta tags in source
   - [ ] Verify banner content displays

2. **Blog List**
   - [ ] Visit `/blog` - Should load fast
   - [ ] Check all posts render
   - [ ] Test navigation to posts

3. **Blog Details**
   - [ ] Visit any `/blog/blog-details/:id`
   - [ ] Check content renders correctly
   - [ ] Verify related posts show
   - [ ] Test back navigation

4. **Navigation**
   - [ ] Test navbar links
   - [ ] Test footer grouped links
   - [ ] Verify mobile responsiveness

5. **API Routes**
   - [ ] Test `/api/v1/list-posts`
   - [ ] Test `/api/v1/get-post?postid=xxx`
   - [ ] Verify caching works

6. **SEO & Performance**
   - [ ] Check OpenGraph tags
   - [ ] Test social media sharing
   - [ ] Run Lighthouse audit (aim for 90+)
   - [ ] Verify sitemap.xml exists

---

## Performance Optimization

### CDN Configuration:
Most hosting providers automatically configure CDN. Verify:
- Static assets served from CDN
- Images compressed and optimized
- Gzip/Brotli compression enabled

### Cache Headers:
Hosting providers usually set these automatically, but verify:
```
Cache-Control: public, max-age=31536000, immutable (for /assets/*)
Cache-Control: public, max-age=0, must-revalidate (for HTML files)
```

---

## Monitoring & Analytics

### Add Google Analytics (Optional):
1. Create GA4 property
2. Add tracking code to `index.html` or via GTM
3. Monitor page views and performance

### Error Monitoring:
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel/Netlify analytics

---

## Troubleshooting

### Build Fails:
```bash
# Check Node version
node --version  # Should be 20.x

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working:
1. Verify variables are set in hosting provider
2. Check variable names match exactly
3. Redeploy after adding variables
4. Check build logs for "Missing environment variables"

### Pre-rendering Issues:
- The build will complete even if pre-rendering fails
- Pages will still work with client-side rendering
- Check API routes are accessible during build
- Verify environment variables are available at build time

### API Routes 500 Errors:
1. Check environment variables are set
2. Verify GOOGLE_BLOGGER_API_KEY is valid
3. Test API directly: `https://your-domain.com/api/v1/get-blog`
4. Check Blogger API quotas haven't been exceeded

---

## Custom Domain Setup

### Vercel:
1. **Project Settings** → **Domains**
2. Add your domain (e.g., `streetsurfclub.ch`)
3. Update DNS records as instructed
4. SSL certificates auto-provisioned

### Netlify:
1. **Domain Settings** → **Add Custom Domain**
2. Update DNS records
3. Enable HTTPS (automatic)

### Cloudflare:
1. Add domain in Cloudflare Pages
2. Update nameservers
3. SSL enabled automatically

---

## Rollback Strategy

### Vercel:
- Go to **Deployments**
- Find previous successful deployment
- Click **Promote to Production**

### Netlify:
- Go to **Deploys**
- Select previous deploy
- Click **Publish Deploy**

### Git-based Rollback:
```bash
git revert HEAD
git push origin main
```

---

## Support & Resources

- **Analog.js Docs**: https://analogjs.org
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Vite Docs**: https://vitejs.dev

---

## Quick Reference Commands

```bash
# Development
npm start                    # Dev server
npm test                     # Run tests

# Production
npm run build               # Build for production
npm run preview             # Preview prod build

# Deployment
vercel                      # Deploy to Vercel
netlify deploy --prod       # Deploy to Netlify

# Utilities
node scripts/generate-routes.mjs  # Generate SSG routes
```

---

**Status**: Ready for production deployment! 🚀
