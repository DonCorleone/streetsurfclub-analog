# Copilot Instructions for streetsurfclub-analog

## Project Overview
This is an **Analog.js (Angular 20 + Vite)** project being developed to **replace the current streetsurfclub-ch website**. 

### Migration Context
- **Source**: `streetsurfclub-ch` workspace (Angular 19 standalone + Netlify Edge Functions)
- **Target**: This Analog.js project with SSR/SSG capabilities
- **Reference Template**: `/canora` folder contains original Angular 17 Canora template with Tailwind CSS
- **Goal**: Rebuild streetsurfclub-ch functionality using Analog.js, replacing Netlify Edge Functions with Analog API routes

### Current State
- Root `/src` contains bootstrapped Analog.js project with Tailwind v4 configured
- `/canora` subfolder has the original Canora template (5 AI landing pages) for reference/reuse

## Critical Architecture Patterns

### Analog.js Architecture (Target Implementation)
- **File-based routing**: Create `src/app/pages/*.page.ts` for routes
  - `index.page.ts` → `/` route
  - `blog.page.ts` → `/blog` route
  - `blog/blog-details.[id].page.ts` → `/blog/blog-details/:id` dynamic route
  - Note: `(folder)` syntax creates layout groups WITHOUT adding to URL path
- **Standalone components**: Use `export default class` with `@Component` decorator
- **No NgModule**: Imports directly in component decorator
- **SSR/SSG enabled**: Pages pre-rendered at build time for fast loading

### Server-Side API Routes (Replacing Netlify Edge Functions)
- **Location**: `src/server/routes/api/v1/*.ts`
- **Pattern**: Use h3's `defineEventHandler` (Node.js runtime, not Deno)
- **Access**: Available at `/api/v1/<filename>`
- **Migration Target**: Replace these 8 Netlify Edge Functions from streetsurfclub-ch:
  - `list-posts.ts` - Fetch blog posts from Blogger API
  - `get-post.ts` - Single post by ID
  - `find-post.ts` - Search posts
  - `list-pages.ts` - Static pages
  - `get-page.ts` - Single page by ID
  - `get-blog.ts` - Blog metadata
  - `list-comments.ts` - Comments for post
  - `add-comment.ts` - Submit new comment

### Reference Template (/canora folder)
- **Purpose**: Source material for UI components and styling
- **Architecture**: NgModule-based Angular 17 (DO NOT copy architecture, only UI/templates)
- **What to Reuse**:
  - Component templates (`.html` files) - adapt to Analog standalone components
  - Styles (`.scss` files) - convert to inline styles or Tailwind classes
  - Layout patterns and structure
  - Asset references
- **What to Avoid**:
  - NgModule declarations
  - Routing module patterns (use Analog file-based routing instead)
  - Multiple landing page variants (focus on noise-cancelling landing for streetsurfclub-ch)

## Build & Development Workflows

### Analog.js Project (Root)
```bash
npm start           # Dev server on http://localhost:5173 (Vite + HMR)
npm run build       # SSR build → dist/analog/{public,server}
npm run preview     # Preview SSR production build
npm test            # Vitest with jsdom

# Pre-rendering
node scripts/generate-routes.mjs  # Generate list of blog post routes for SSG
```

**Build Output**:
- `dist/analog/public/` - Static assets and pre-rendered pages (SSG)
- `dist/analog/server/` - Node.js server for SSR
- Run preview with: `node dist/analog/server/index.mjs`

**Pre-rendering**: Blog posts are pre-rendered at build time for optimal SEO and performance. The `generate-routes.mjs` script fetches all posts from Blogger API and generates static routes.

### Reference Template (Canora - for UI reference only)
```bash
cd canora
npm start           # Dev server on http://localhost:4200
```

**Do not use canora build commands for production** - it's reference material only.

## Styling & UI Dependencies

### Root: Tailwind CSS v4
- Configured via `@tailwindcss/vite` plugin in `vite.config.ts`
- Import in `src/styles.css`: `@import 'tailwindcss';`
- No `tailwind.config.js` needed (v4 convention)

### Canora: Tailwind CSS v3 + Specialty Libraries
- Config: `canora/tailwind.config.js`
- UI libraries: `ngx-owl-carousel-o`, `ngx-scrolltop`, AOS animations, Remixicon
- `AppComponent` initializes AOS in constructor

## Component Conventions

### Analog Components (This Project)
- **Standalone components** with `export default class` for pages
- Use `imports` array in `@Component` decorator
- **Pages** (routable): `src/app/pages/*.page.ts`
  ```typescript
  @Component({
    selector: 'app-blog',
    imports: [NavbarComponent, FooterComponent],
    template: `<app-navbar/><main>...</main><app-footer/>`
  })
  export default class BlogComponent {}
  ```
- **Shared components**: `src/app/components/*.ts`
  ```typescript
  @Component({
    selector: 'app-navbar',
    imports: [RouterLink],
    template: `<nav>...</nav>`
  })
  export class NavbarComponent {}  // No default export
  ```

### Migrating from streetsurfclub-ch
- **Use Original HTML templates** from canora template and adapt to streetsurfclub-ch structure
- **Use streetsurfclub-ch** navigation and structure
- **Convert to standalone**: Add `imports` array, remove `templateUrl` if keeping inline
- **Update selectors**: Use `ancal-*` prefix for noise-cancelling landing components
- **Services**: Use `inject()` function for DI (modern Angular pattern)
- **New Template Syntax**; Use Angular 19+ syntax (e.g. @if, @for)
- **Content parsing**: Reuse `ContentService` and `BloggerService` logic

## Configuration Files

### Root Project
- `vite.config.ts`: Analog + Tailwind plugins, Vitest config
- `angular.json`: Uses `@analogjs/platform:vite` builder (not standard Angular builder)
- `src/app/app.config.ts`: Providers for Analog router, HTTP client with SSR interceptor, client hydration

### Canora
- Standard Angular CLI workspace structure
- `canora/angular.json`: Uses `@angular-devkit/build-angular`

## Migration Checklist & Feature Implementation

### Phase 1: Core Infrastructure ✅ COMPLETED
- [x] Set up API routes in `src/server/routes/api/v1/` to replace Netlify Edge Functions
- [x] Migrate `BloggerService` from streetsurfclub-ch
- [x] Migrate `ContentService` for HTML parsing
- [x] Migrate `MetaService` for SEO
- [x] Configure environment variables for Google Blogger API

### Phase 2: Pages & Components ✅ COMPLETED
- [x] Migrate navbar component (ancal-navbar) - No dark mode
- [x] Migrate footer component (ancal-footer) - No dark mode
- [x] Create `index.page.ts` - Main landing (noise-cancelling template from canora)
- [x] Create `blog.page.ts` - Blog list page
- [x] Create `(blog)/blog-details.[id].page.ts` - Dynamic blog post page
- [x] Port banner component (ancal-banner) from streetsurfclub-ch
- [x] Port blog list component (ancal-blog) with cards

### Phase 3: Content & Data Flow ✅ COMPLETED
- [x] Implement BehaviorSubject caching pattern in services (posts$, blog$, pages$ observables)
- [x] Add intelligent caching for posts and individual post fetching
- [x] Set up SSG configuration with prerender routes in vite.config.ts
- [x] Configure meta tags and SEO for pre-rendered pages (updateMetaTags method)
- [x] Add loading skeleton components for better UX
- [x] Create route generation script for dynamic blog posts
- [x] Improve error handling throughout services

### Phase 4: Deployment & Production ✅ COMPLETED
- [x] Test SSG build with `npm run build`
- [x] Configure production build without pre-rendering by default
- [x] Add deployment configs for Vercel, Netlify, Cloudflare Pages
- [x] Create comprehensive deployment documentation (DEPLOYMENT.md)
- [x] Document performance optimizations (OPTIMIZATIONS.md)
- [x] Create production-ready README
- [x] Set up optional pre-rendering with `PRERENDER=true`
- [ ] Deploy to hosting provider (manual step)
- [ ] Configure custom domain and SSL (manual step)
- [ ] Monitor performance and SEO metrics (post-deployment)

### Phase 5: Deferred Features  
- ⏸️ **Dark mode** - Explicitly excluded from initial implementation
- ⏸️ Additional landing page variants (chatbot, writer, etc.) - canora reference only
- ⏸️ Search functionality - Full-text search across posts
- ⏸️ Pagination controls - For blog list page
- ⏸️ Comments system - Comment fetching and posting
- ⏸️ Analytics integration - Google Analytics or similar

### Adding New Features
**New Page**: Create `src/app/pages/page-name.page.ts` with `export default class`
**New API Endpoint**: Create `src/server/routes/api/v1/endpoint-name.ts` with `defineEventHandler`
**New Component**: Create in `src/app/components/` without default export

## Testing
- Root uses **Vitest** with `src/test-setup.ts` and `@analogjs/vitest-angular`
- Canora uses **Karma/Jasmine** (traditional Angular testing)
- Test files: `*.spec.ts` in both projects

## Recent Enhancements (Phase 3)

### Caching Strategy
- **BehaviorSubject Pattern**: Services use observables (blog$, pages$, posts$) for reactive data flow
- **Intelligent Caching**: 
  - Posts cached by maxResults parameter to avoid redundant API calls
  - Individual posts cached by ID
  - Pages cached at service initialization
- **Performance**: Reduces API calls and improves loading times

### Loading States
- **LoadingSkeletonComponent**: Provides visual feedback during data fetching
- **Types**: 'post-card', 'banner', 'post-detail' for different contexts
- **UX Enhancement**: Better perceived performance with skeleton screens

### SSG Configuration
- **Pre-rendering**: Home, blog list, and all blog post pages rendered at build time
- **Sitemap**: Configured for streetsurfclub.ch domain
- **Route Generation**: Script fetches all posts from Blogger API for build-time rendering

## Key Implementation Details

### API Routes (h3 Event Handlers)
- **Environment**: Node.js runtime (unlike Deno in Netlify Edge Functions)
- **Pattern**:
  ```typescript
  import { defineEventHandler } from 'h3';
  
  export default defineEventHandler(async (event) => {
    const apiKey = process.env['GOOGLE_BLOGGER_API_KEY'];
    // Fetch from Google Blogger API
    return { items: [...] };
  });
  ```
- **Key differences from Netlify**:
  - Use `process.env` not `Netlify.env.get()`
  - No CORS headers needed (same-origin in SSR)
  - Can use full Node.js APIs

### SSR/SSG Configuration
- **Enabled by default** in Analog.js via `@analogjs/platform`
- Pages pre-rendered at build time for optimal performance
- Dynamic routes require `prerender` config in `vite.config.ts`
- Meta tags must be set server-side for SEO (use `MetaService`)

### Content Parsing from Blogger
- Reuse regex patterns from streetsurfclub-ch `ContentService`
- Parse custom metadata: `lead=""`, `sortorder=""`, `group=""` from title field
- Extract header images from HTML content
- Transform Blogger HTML to Tailwind-styled components

### Environment Variables
Required in `.env` (create from `.env.example`):
```
GOOGLE_BLOGGER_API_KEY=your-api-key
GOOGLE_BLOGGER_ID=your-blog-id
BLOG_MAX_RESULTS=300
BLOG_MAX_RESULTS_MOBILE=50
```

## Dependencies to Know
- **Analog**: `@analogjs/router`, `@analogjs/content`, `@analogjs/platform`
- **SSR**: `@angular/platform-server`, `provideClientHydration(withEventReplay())`
- **API**: `h3` event handlers for server routes
- **Node version**: `>=20.19.1` (from package.json engines)
- **Tailwind CSS**: v4 with `@tailwindcss/vite` plugin

## Cross-Workspace References

### streetsurfclub-ch (Source for Migration)
- **Services**: `BloggerService`, `ContentService`, `MetaService` → Migrate to analog
- **Components**: All standalone Angular 19 → Adapt to Analog patterns
- **Models**: `Post`, `Page`, `IContent`, `BlogResponse` → Copy interfaces
- **Pipes**: `SafeHtmlPipe` → Reuse for Blogger HTML rendering

### canora (UI Template Reference)
- **Landing Page**: `ai-noise-cancelling-app-landing/` → Primary template
- **Components**: Use HTML/CSS structure, convert to standalone Analog components
- **Styling**: Tailwind classes and AOS animations → Keep in new implementation
- **Avoid**: NgModule patterns, routing module, multiple landing variants
