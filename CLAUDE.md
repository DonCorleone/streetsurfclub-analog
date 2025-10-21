# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Street Surf Club is a **fully static Angular 20 blog** built with **Analog.js** (Angular meta-framework) using Vite for builds and **Static Site Generation (SSG)**. The app integrates with the **Google Blogger API** to fetch blog content at build time and pre-renders ALL pages for deployment on **Render.com** as a static site.

**Key Architecture**:
- **Root project** (`/src`): Analog.js (Angular 20 + Vite) - Modern meta-framework with file-based routing and full SSG
- **Canora subfolder** (`/canora`): Template source (not used in production) - Original Angular 17 template purchased from HiBootstrap
- **Deployment**: Static files served from Render.com - **all pages work without JavaScript**

## Essential Commands

### Development & Build
```bash
npm start                       # Start dev server on http://localhost:5173
npm test                        # Run Vitest tests

# Production Build (IMPORTANT: Always use prerender for deployment)
node scripts/prerender-routes.mjs  # Generate routes (run FIRST before build)
npm run build:prerender            # Build with full static pre-rendering
npm run preview                    # Preview production build locally
```

**CRITICAL**: For production deployment on Render, you MUST:
1. Run `node scripts/prerender-routes.mjs` to generate `prerender-routes.json` with ALL routes
2. Run `npm run build:prerender` to create fully static site

### Canora Subfolder (Not Used in Production)
This folder contains the original template - not part of the production build.

## Critical Architecture Patterns

### File-Based Routing (Analog.js)
Routes are automatically generated from file structure in `src/app/pages/`:
- `index.page.ts` → `/`
- `blog/index.page.ts` → `/blog`
- `blog/blog-details.post.[id].page.ts` → `/blog/blog-details/post/:id` (dynamic route)
- `blog/blog-details.page.[id].page.ts` → `/blog/blog-details/page/:id` (static pages)

**Component Pattern**: All page components must:
- Use `export default class ComponentName`
- Be standalone components (no NgModule)
- Import dependencies in `@Component` decorator's `imports` array
- Use inline templates or separate HTML files

### API Routes (h3/Nitro)
Server-side API endpoints live in `src/server/routes/api/v1/*.ts`:
- Accessible at `/api/v1/<filename>`
- Use `defineEventHandler` from h3
- Example endpoints:
  - `/api/v1/list-posts` - Fetch blog posts
  - `/api/v1/list-pages` - Fetch static pages
  - `/api/v1/get-post` - Get single post by ID
  - `/api/v1/find-post` - Search for posts

### Caching Strategy
The application uses **server-side caching** (`src/server/utils/api-cache.ts`) to prevent Google Blogger API rate limits:
- 5-minute TTL for API responses
- In-memory cache with automatic expiration
- `getBloggerApiData()` wrapper handles caching + retry logic
- Critical for prerendering to avoid rate limit errors

### Prerendering Configuration (Full Static Site)
Controlled via `vite.config.ts` and `scripts/prerender-routes.mjs`:
- **Enabled when**: `PRERENDER=true` environment variable is set (via `npm run build:prerender`)
- **Routes**: Loaded from `prerender-routes.json` which contains ALL 75 blog posts + 9 static pages + homepage + blog list
- **Generation**: Run `node scripts/prerender-routes.mjs` to regenerate routes from Blogger API
- **Result**: Fully static site with ~86 HTML files - **zero JavaScript required for content display**

## Component Architecture

### Standalone Components (Root Project)
All components in `/src/app/components/` follow standalone pattern:
```typescript
@Component({
  selector: 'app-component-name',
  imports: [CommonModule, RouterLink, ...],
  template: `...` // or templateUrl
})
export class ComponentName { }
```

### Key Services
- **BloggerService** (`src/app/services/blogger.service.ts`): Calls API routes, manages blog data observables
- **ContentService** (`src/app/services/content.service.ts`): Parses Blogger HTML content, extracts images, handles formatting
- **MetaService** (`src/app/services/meta.service.ts`): Updates SEO meta tags dynamically

### Data Flow
1. Page component calls `BloggerService` method (e.g., `getPosts()`)
2. Service makes HTTP request to `/api/v1/*` endpoint
3. API route calls `getBloggerApiData()` which checks cache
4. If cache miss, fetches from Google Blogger API with retry logic
5. Response cached and returned to frontend
6. `ContentService.parseContent()` transforms raw Blogger data into `IContent` interface
7. Component renders using parsed content

## Configuration Files

### Root Project
- **`vite.config.ts`**: Analog + Tailwind plugins, Vitest config, prerender routes
- **`src/app/app.config.ts`**: Angular providers (file router, HTTP client with SSR interceptor, client hydration)
- **`src/app/app.config.server.ts`**: Server-specific providers
- **`angular.json`**: Uses `@analogjs/platform:vite` builder (not standard Angular CLI builder)

### Environment Variables
Required in `.env`:
```bash
GOOGLE_BLOGGER_API_KEY=your-api-key
GOOGLE_BLOGGER_ID=your-blog-id
BLOG_MAX_RESULTS=300          # Desktop max results
BLOG_MAX_RESULTS_MOBILE=50    # Mobile max results
```

### Tailwind CSS
- **Root**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no config file needed)
- **Canora**: Tailwind CSS v3 with `canora/tailwind.config.js`

## Testing
- **Framework**: Vitest with jsdom environment
- **Setup**: `src/test-setup.ts` with `@analogjs/vitest-angular`
- **Pattern**: `*.spec.ts` files alongside components
- **Run**: `npm test`

## Build & Deployment

### Build Strategy
**This project uses FULL Static Site Generation (SSG)** - all pages are pre-rendered at build time:

1. **Generate Routes**: `node scripts/prerender-routes.mjs` fetches ALL posts/pages from Blogger API and creates `prerender-routes.json`
2. **Build Static Site**: `npm run build:prerender` (sets `PRERENDER=true`) pre-renders all 86 routes to static HTML
3. **Deploy**: Upload `dist/analog/public/` to Render.com as static files

### Deployment Target
- **Render.com**: Static site hosting - serves pre-rendered HTML files
- **No server required**: All pages are static HTML/CSS/JS files
- **Works without JavaScript**: Content is fully rendered in HTML at build time

### Important Prerender Notes
- **Route discovery is DISABLED** (`discover: true` is disabled in `vite.config.ts`)
- **Reason**: Dynamic routes with invalid IDs would cause build failures
- **Strategy**: `prerender-routes.json` explicitly lists ALL valid routes from Blogger API
- **Update routes**: When new blog posts are published, regenerate routes and rebuild
- **Caching prevents rate limits**: Server-side API cache prevents hitting Google API limits during build

## Key Models & Interfaces
- **`Post`** (`src/app/models/posts.ts`): Raw Blogger post response
- **`Page`** (`src/app/models/pages.ts`): Raw Blogger page response
- **`IContent`** (`src/app/models/IContent.ts`): Parsed content interface with extracted images, lead text, etc.
- **`Blog`** (`src/app/models/blog.ts`): Blog metadata and post collection

## Common Pitfalls

### When Adding New Content
1. New blog posts/pages published in Blogger are **NOT automatically added** to the static site
2. To deploy new content:
   - Run `node scripts/prerender-routes.mjs` to regenerate routes
   - Run `npm run build:prerender` to rebuild static site
   - Deploy updated `dist/analog/public/` to Render

### When Adding New Routes
- Create `*.page.ts` file in `src/app/pages/` - route auto-generated
- For dynamic routes, use bracket syntax: `[id].page.ts` or `post.[id].page.ts`
- **MUST** regenerate `prerender-routes.json` and rebuild for route to work in production

### When Modifying API Routes
- API routes are used **ONLY during build time** for SSG
- Always use `getBloggerApiData()` wrapper for Blogger API calls (includes caching)
- Use `getQuery(event)` to read query parameters
- Environment variables accessed via `process.env['VAR_NAME']`

### When Working with Content
- Raw Blogger content contains encoded HTML - use `ContentService.parseContent()`
- Always use `SafeHtmlPipe` when rendering parsed content
- Header images extracted from content or Blogger `images` array
- Lead text extracted from title attribute pattern: `lead="text"`

### Route Strategy
- **Posts** (blog articles): `/blog/blog-details/post/[id]` → `blog-details.post.[id].page.ts`
- **Pages** (static pages like About, Contact): `/blog/blog-details/page/[id]` → `blog-details.page.[id].page.ts`
- Both use same logic but different API endpoints (`get-post` vs `get-page`)

### Canora Folder
- **NOT used in production** - this is just the template source
- Original Angular 17 template purchased from HiBootstrap
- Can be safely ignored when working on the blog
