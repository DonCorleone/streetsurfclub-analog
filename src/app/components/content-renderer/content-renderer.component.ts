import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { GalleryComponent, GalleryImage } from '../gallery/gallery.component';

interface ContentSegment {
  type: 'html' | 'gallery';
  content: string;
  images?: GalleryImage[];
}

@Component({
  selector: 'app-content-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe, GalleryComponent],
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.type === 'html') {
        <div [innerHTML]="segment.content | safeHtml"
             class="prose prose-slate dark:prose-invert max-w-none text-[15px] md:text-[16px] leading-[1.8] text-body">
        </div>
      } @else if (segment.type === 'gallery' && segment.images) {
        <app-gallery [images]="segment.images" />
      }
    }
  `,
})
export class ContentRendererComponent {
  // Input for the raw HTML content
  htmlContent = input.required<string>();

  // Computed segments that split content into HTML and Gallery chunks
  segments = computed<ContentSegment[]>(() => {
    const content = this.htmlContent();
    if (!content) return [];

    const segments: ContentSegment[] = [];

    // Regular expression to find gallery placeholders
    const galleryRegex = /<div data-gallery-images="([^"]+)"><\/div>/g;

    let lastIndex = 0;
    let match;

    while ((match = galleryRegex.exec(content)) !== null) {
      // Add HTML content before this gallery
      if (match.index > lastIndex) {
        const htmlContent = content.substring(lastIndex, match.index);
        if (htmlContent.trim()) {
          segments.push({
            type: 'html',
            content: htmlContent,
          });
        }
      }

      // Add gallery segment
      // Parse format: "thumbnail1::fullsize1|thumbnail2::fullsize2"
      const imagePairs = match[1].split('|').filter(pair => pair.trim());
      const images: GalleryImage[] = imagePairs.map(pair => {
        const [thumbnail, fullSize] = pair.split('::');
        return {
          thumbnail: thumbnail || '',
          fullSize: fullSize || thumbnail || ''
        };
      }).filter(img => img.thumbnail);

      if (images.length > 0) {
        segments.push({
          type: 'gallery',
          content: match[0],
          images: images,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining HTML content after last gallery
    if (lastIndex < content.length) {
      const htmlContent = content.substring(lastIndex);
      if (htmlContent.trim()) {
        segments.push({
          type: 'html',
          content: htmlContent,
        });
      }
    }

    // If no galleries found, return entire content as HTML segment
    if (segments.length === 0) {
      segments.push({
        type: 'html',
        content: content,
      });
    }

    return segments;
  });
}
