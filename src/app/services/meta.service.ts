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
      this.titleService.setTitle(meta.title);
      
      const nameTags: MetaDefinition[] = [
        { name: 'description', content: meta.description },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: meta.title },
        { name: 'twitter:description', content: meta.description },
        { name: 'twitter:image', content: meta.image }
      ];

      const propertyTags: MetaDefinition[] = [
        { property: 'og:title', content: meta.title },
        { property: 'og:description', content: meta.description },
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
