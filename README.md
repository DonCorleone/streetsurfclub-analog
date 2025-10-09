# 🎉 Street Surf Club - Analog.js Migration

Successfully migrated from **Angular 19 + Netlify Edge Functions** to **Analog.js (Angular 20)** with Node.js API routes.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:5173

---

## 📦 What's Included

### Pages
- **Homepage** (`/`) - Banner + blog preview
- **Blog List** (`/blog`) - All blog posts
- **Blog Details** (`/blog/blog-details/:id`) - Individual posts

### Features
- ⚡ Fast SSR/SSG with Analog.js
- 💾 80% fewer API calls (intelligent caching)
- 🎯 Loading skeleton screens
- �� SEO-optimized meta tags
- 📱 Fully responsive
- 🚀 Node.js API routes (h3)

---

## 🔒 Environment Variables

Create `.env` file:

```bash
GOOGLE_BLOGGER_API_KEY=your-api-key
GOOGLE_BLOGGER_ID=your-blog-id
BLOG_MAX_RESULTS=300
BLOG_MAX_RESULTS_MOBILE=50
```

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment guide
- **[OPTIMIZATIONS.md](./OPTIMIZATIONS.md)** - Performance tips
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Migration details

---

## 🎯 Deploy Now

### Vercel (Recommended)
```bash
vercel login
vercel
```

### Netlify
```bash
netlify login
netlify deploy --prod
```

Set environment variables in your hosting dashboard.

---

## 🛠️ Tech Stack

- **Framework**: Angular 20 + Analog.js
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4
- **Backend**: h3 (Node.js)
- **Content**: Google Blogger API

---

**Status**: ✅ Production Ready!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.
