import { Injectable, inject } from '@angular/core';
import { Page } from '../models/pages';
import { IContent } from '../models/IContent';
import { Post } from '../models/posts';
import { ImageService } from './image.service';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private imageService = inject(ImageService);
  parseContent(page: Page): IContent | null {
    if (!page) {
      return null;
    }

    let parsedContent: IContent = {
      author: '',
      date: new Date(),
      id: '',
      title: '',
      content: '',
      lead: '',
      preview: '',
      headerImg: null,
      imageFirst: false,
      amountReplies: '0',
    };

    if (page.kind === 'blogger#post') {
      parsedContent.amountReplies = (page as Post).replies?.totalItems;
    }
    if (page.content) {
      let decodedContent = decodeURIComponent(
        page.content.replace(/\\u/g, '%')
      );

      // Find first <img> in content and determine its position relative to text
      const imgRegexContent = /<img[^>]+src="([^">]+)"[^>]*>/;
      const imgMatch = decodedContent.match(imgRegexContent);

      if (imgMatch && imgMatch.index !== undefined) {
        const imgSrc = imgMatch[1];
        // Estimate text before image: strip tags from content before the img position
        const contentBeforeImg = decodedContent.slice(0, imgMatch.index);
        const textBeforeImg = contentBeforeImg.replace(/<[^>]*>/g, '').trim();
        parsedContent.headerImg = imgSrc;
        parsedContent.imageFirst = textBeforeImg.length === 0;
        // Remove the image (and its wrapping block if present) from content
        // Try to remove a wrapping <div class="separator"...>...</div> block first
        const separatorRegex = /<div[^>]*class="separator"[^>]*>[\s\S]*?<\/div>/;
        const sepMatch = decodedContent.match(separatorRegex);
        if (sepMatch && sepMatch[0].includes(imgMatch[1])) {
          decodedContent = decodedContent.replace(sepMatch[0], '');
        } else {
          decodedContent = decodedContent.replace(imgMatch[0], '');
        }
      } else {
        // No image in content — fall back to Blogger images[] array
        if (page.kind === 'blogger#post') {
          const images = (page as Post).images;
          if (images && images.length > 0) {
            parsedContent.headerImg = images[0].url;
            parsedContent.imageFirst = false; // unknown order, default text-left
          }
        }
      }

      // Process gallery markers before proxying images
      decodedContent = this.processGalleries(decodedContent);

      // Proxy all images in the content through Netlify Image CDN
      decodedContent = this.proxyContentImages(decodedContent);

      parsedContent.content = decodedContent;
    }

    const leadRegex = /lead=\"(.*?)\"/;
    const matchLead = page.title.match(leadRegex);

    if (matchLead) {
      parsedContent.lead = matchLead[1];
    }

    // Strip anchor tags from title to prevent nested links
    let title = page.title;
    if (title) {
      // Remove <a> tags but keep the text content
      title = title.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
    }
    parsedContent.title = title;
    parsedContent.id = page.id;
    parsedContent.date = new Date(page.published);
    parsedContent.author = page.author?.displayName;

    // Extract preview text from content
    if (parsedContent.content) {
      // Strip HTML tags and decode entities
      const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
      if (tempDiv) {
        tempDiv.innerHTML = parsedContent.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        // Truncate to ~150 characters, but don't cut words
        const maxLength = 150;
        if (plainText.length > maxLength) {
          const truncated = plainText.substring(0, maxLength);
          const lastSpace = truncated.lastIndexOf(' ');
          parsedContent.preview = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
        } else {
          parsedContent.preview = plainText;
        }
      } else {
        // SSR fallback: simple regex to strip tags
        const textOnly = parsedContent.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const maxLength = 150;
        if (textOnly.length > maxLength) {
          const truncated = textOnly.substring(0, maxLength);
          const lastSpace = truncated.lastIndexOf(' ');
          parsedContent.preview = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
        } else {
          parsedContent.preview = textOnly;
        }
      }
    }

    return parsedContent;
  }

  /**
   * Processes gallery markers in content
   * Detects <!-- gallery-start -->...<!-- gallery-end --> blocks and extracts images
   * Handles Blogger's <a><img></a> structure for full-size image links
   */
  private processGalleries(htmlContent: string): string {
    if (!htmlContent) return htmlContent;

    // Regular expression to match gallery blocks
    const galleryRegex = /<!--\s*gallery-start\s*-->([\s\S]*?)<!--\s*gallery-end\s*-->/gi;

    return htmlContent.replace(galleryRegex, (_match, galleryContent) => {
      // First, try to extract images wrapped in <a> tags (Blogger format)
      // Pattern: <a href="full-size.jpg"><img src="thumbnail.jpg" /></a>
      const linkedImageRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>\s*<img[^>]+src=["']([^"']+)["'][^>]*>\s*<\/a>/gi;
      const imageData: Array<{ thumbnail: string; fullSize: string }> = [];
      let linkedMatch;

      while ((linkedMatch = linkedImageRegex.exec(galleryContent)) !== null) {
        imageData.push({
          fullSize: linkedMatch[1],  // URL from <a href>
          thumbnail: linkedMatch[2]  // URL from <img src>
        });
      }

      // If no linked images found, try standalone <img> tags
      if (imageData.length === 0) {
        const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let imgMatch;

        while ((imgMatch = imgSrcRegex.exec(galleryContent)) !== null) {
          // Use same URL for both thumbnail and full-size
          imageData.push({
            thumbnail: imgMatch[1],
            fullSize: imgMatch[1]
          });
        }
      }

      // If we found images, create a gallery placeholder
      if (imageData.length > 0) {
        // Proxy images through CDN
        const proxiedData = imageData.map(img => ({
          thumbnail: this.imageService.getOptimizedImageUrl(img.thumbnail, 1200),
          fullSize: this.imageService.getOptimizedImageUrl(img.fullSize, 2400) // Higher res for zoom
        }));

        // Create data attributes with both thumbnail and full-size URLs
        // Format: "thumbnail1::fullsize1|thumbnail2::fullsize2"
        const galleryString = proxiedData
          .map(img => `${img.thumbnail}::${img.fullSize}`)
          .join('|');

        return `<div data-gallery-images="${galleryString}"></div>`;
      }

      // If no images found, return empty string
      return '';
    });
  }

  /**
   * Proxies all images in HTML content through Netlify Image CDN
   * Finds all <img> tags and replaces src attributes with optimized URLs
   */
  private proxyContentImages(htmlContent: string): string {
    if (!htmlContent) return htmlContent;

    // Regular expression to match all <img> tags with src attribute
    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;

    return htmlContent.replace(imgRegex, (_match, before, src, after) => {
      // Proxy the image through Netlify with a reasonable width (1200px for content images)
      const proxiedSrc = this.imageService.getOptimizedImageUrl(src, 1200);

      // Reconstruct the img tag with proxied src
      return `<img${before}src="${proxiedSrc}"${after}>`;
    });
  }
}
