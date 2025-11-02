import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly netlifyBaseUrl = 'https://streetsurfclub.netlify.app';

  /**
   * Transforms an image URL to use Netlify's image CDN for optimization
   * @param url - Original image URL
   * @param width - Desired width (optional)
   * @param height - Desired height (optional)
   * @param fit - Fit mode: 'cover' | 'contain' | 'fill' (default: 'cover')
   * @returns Optimized image URL
   */
  getOptimizedImageUrl(
    url: string,
    width?: number,
    height?: number,
    fit?: 'cover' | 'contain' | 'fill'
  ): string {
    if (!url) return '';

    // Build Netlify Image CDN URL
    const params = new URLSearchParams();
    params.set('url', url);

    if (width) {
      params.set('w', width.toString());
    }

    if (height) {
      params.set('h', height.toString());
    }

    // Only set fit if explicitly provided
    if (fit) {
      params.set('fit', fit);
    }

    return `${this.netlifyBaseUrl}/.netlify/images?${params.toString()}`;
  }
}
