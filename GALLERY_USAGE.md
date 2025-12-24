# Gallery Feature Usage Guide

## Overview
The blog now supports image galleries/sliders for displaying multiple images in a beautiful, interactive Swiper carousel.

## Features
- ✅ Swiper-based carousel with smooth transitions
- ✅ Navigation arrows (previous/next)
- ✅ Pagination dots (clickable)
- ✅ **Click to view full-size images** (opens in new tab)
- ✅ **Automatically detects Blogger's `<a><img></a>` structure**
- ✅ Keyboard navigation (arrow keys)
- ✅ Touch/swipe gestures on mobile
- ✅ Dark mode support
- ✅ Fully SSR/SSG compatible
- ✅ Lazy loading for images
- ✅ Responsive design
- ✅ Images optimized through Netlify CDN (1200px thumbnails, 2400px full-size)

## How Authors Can Use It

### In Blogger.com Editor

1. **Insert your images** normally in the Blogger editor (using the image button)
2. Blogger automatically wraps images in `<a>` tags linking to full-size versions
3. Switch to **HTML view** in the Blogger editor
4. Wrap the image block with HTML comments:

```html
<!-- gallery-start -->
<a href="full-size-image1.jpg"><img src="thumbnail1.jpg" alt="Image 1"></a>
<a href="full-size-image2.jpg"><img src="thumbnail2.jpg" alt="Image 2"></a>
<a href="full-size-image3.jpg"><img src="thumbnail3.jpg" alt="Image 3"></a>
<a href="full-size-image4.jpg"><img src="thumbnail4.jpg" alt="Image 4"></a>
<!-- gallery-end -->
```

5. Save and publish your post

**Note:** The system automatically detects Blogger's `<a><img></a>` structure and extracts both thumbnail and full-size URLs!

### Example with Blogger's Automatic Linking

```html
<p>Here's my photo collection from the event:</p>

<!-- gallery-start -->
<a href="https://blogger.com/img/full-photo1.jpg">
  <img src="https://blogger.com/img/s1200/photo1.jpg" />
</a>
<a href="https://blogger.com/img/full-photo2.jpg">
  <img src="https://blogger.com/img/s1200/photo2.jpg" />
</a>
<a href="https://blogger.com/img/full-photo3.jpg">
  <img src="https://blogger.com/img/s1200/photo3.jpg" />
</a>
<!-- gallery-end -->

<p>Wasn't that amazing?</p>
```

### Example with Plain Images (No Links)

If you don't want links, you can also use plain `<img>` tags:

```html
<!-- gallery-start -->
<img src="https://example.com/photo1.jpg">
<img src="https://example.com/photo2.jpg">
<!-- gallery-end -->
```

## Important Notes

- **Minimum 2 images**: Galleries work best with 2 or more images
- **No special formatting needed**: Just simple `<img>` tags inside the markers
- **Works anywhere**: Place galleries anywhere in your content
- **Multiple galleries**: You can have multiple galleries in one post
- **SSG compatibility**: Galleries are automatically processed during build time

## Technical Details

### How It Works

1. **Content Service**: Detects `<!-- gallery-start -->...<!-- gallery-end -->` markers
2. **Image Extraction**:
   - Detects Blogger's `<a href="full-size"><img src="thumbnail"></a>` structure
   - Extracts both thumbnail and full-size URLs
   - Falls back to plain `<img>` tags if no links found
3. **CDN Optimization**:
   - Thumbnails optimized at 1200px (for slider display)
   - Full-size images optimized at 2400px (for viewing)
   - All images proxied through Netlify Image CDN
4. **Placeholder Creation**: Replaces gallery blocks with data attributes
5. **Content Renderer**: Detects placeholders and renders Swiper galleries
6. **SSR Fallback**: Shows simple image grid during SSR, hydrates to Swiper on client
7. **Click Behavior**: Clicking images opens full-size version in new tab

### Styling

The gallery inherits dark mode from the blog theme:
- **Light mode**: White navigation buttons, dark pagination dots
- **Dark mode**: Dark navigation buttons, light pagination dots
- **Responsive**: Contained width (max 1200px), full-width on mobile

### Accessibility

- Keyboard navigation enabled (arrow keys)
- ARIA attributes for screen readers
- Alt text preserved from original images
- Focus management for navigation controls

## Deployment

When deploying, the gallery feature works seamlessly with:
- ✅ Development server (`npm start`)
- ✅ Production build (`npm run build:prerender`)
- ✅ Static site generation (SSG)
- ✅ Server-side rendering (SSR)

No special configuration needed!
