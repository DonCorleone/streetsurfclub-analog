import { Injectable, inject } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { Blog } from '../interfaces/blog.interface';

const DEFAULT_LOCALE = 'en_US';

const META_TAGS = {
  name: ['description', 'keywords', 'author', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'],
  property: ['og:title', 'og:description', 'og:type', 'og:image', 'og:url', 'og:locale']
} as const;

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  private stripHtml(html: string): string {
    if (!html) return '';

    // Create a temporary div element to decode HTML entities and strip tags
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }

    // Fallback for SSR: simple regex-based stripping
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'")  // Replace &#39; with '
      .trim();
  }

  updateMetaForBlog(blog: Blog): void {
    try {
      this.clearMetaTags();
      this.titleService.setTitle(blog.name);
      
      const nameTags: MetaDefinition[] = [
        { name: 'description', content: `${blog.name} - ${blog.description}` },
        { name: 'keywords', content: blog.keywords?.join(', ') || '' },
        { name: 'author', content: blog.author || '' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: blog.name },
        { name: 'twitter:description', content: blog.description },
        { name: 'twitter:image', content: blog.image || '' }
      ];

      const propertyTags: MetaDefinition[] = [
        { property: 'og:title', content: blog.name },
        { property: 'og:description', content: blog.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: blog.image || '' },
        { property: 'og:url', content: blog.url || (typeof window !== 'undefined' ? window.location.href : '') },
        { property: 'og:locale', content: blog.locale || DEFAULT_LOCALE }
      ];

      nameTags.forEach(tag => this.meta.updateTag(tag));
      propertyTags.forEach(tag => this.meta.updateTag(tag));
    } catch (error) {
      console.error('Error updating meta tags:', error);
      throw new Error('Failed to update meta tags');
    }
  }

  updateMetaTags(meta: { title: string; description: string; image: string }): void {
    try {
      this.clearMetaTags();

      // Strip HTML from title and description for meta tags
      const cleanTitle = this.stripHtml(meta.title);
      const cleanDescription = this.stripHtml(meta.description);

      this.titleService.setTitle(cleanTitle);

      const nameTags: MetaDefinition[] = [
        { name: 'description', content: cleanDescription },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: cleanTitle },
        { name: 'twitter:description', content: cleanDescription },
        { name: 'twitter:image', content: meta.image }
      ];

      const propertyTags: MetaDefinition[] = [
        { property: 'og:title', content: cleanTitle },
        { property: 'og:description', content: cleanDescription },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: meta.image },
        { property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : '' },
        { property: 'og:locale', content: DEFAULT_LOCALE }
      ];

      nameTags.forEach(tag => this.meta.updateTag(tag));
      propertyTags.forEach(tag => this.meta.updateTag(tag));
    } catch (error) {
      console.error('Error updating meta tags:', error);
    }
  }

  private clearMetaTags(): void {
    [...META_TAGS.name.map(tag => `name='${tag}'`),
     ...META_TAGS.property.map(tag => `property='${tag}'`)]
      .forEach(selector => this.meta.removeTag(selector));
  }
}
