import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageService } from '../services/image.service';

@Pipe({
  name: 'netlifyImage',
  standalone: true
})
export class NetlifyImagePipe implements PipeTransform {
  private imageService = inject(ImageService);

  transform(
    url: string | null | undefined,
    width?: number,
    height?: number,
    fit?: 'cover' | 'contain' | 'fill'
  ): string {
    if (!url) return '';
    return this.imageService.getOptimizedImageUrl(url, width, height, fit);
  }
}
