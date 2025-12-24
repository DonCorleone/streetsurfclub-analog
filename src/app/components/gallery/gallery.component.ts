import {
  Component,
  input,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  effect,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

export interface GalleryImage {
  thumbnail: string;
  fullSize: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="gallery-container my-6">
      @if (isBrowser()) {
        <swiper-container
          #swiperContainer
          [attr.navigation]="true"
          [attr.pagination]="true"
          [attr.pagination-clickable]="true"
          [attr.space-between]="20"
          [attr.slides-per-view]="1"
          [attr.zoom]="true"
          class="rounded-lg overflow-hidden"
        >
          @for (image of images(); track $index) {
            <swiper-slide>
              <div class="swiper-zoom-container aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-zoom-in">
                <a [href]="image.fullSize" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                  <img
                    [src]="image.thumbnail"
                    [alt]="'Gallery image ' + ($index + 1)"
                    class="w-full h-full object-contain hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </a>
              </div>
            </swiper-slide>
          }
        </swiper-container>
        <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click on images to view full size • Swipe or use arrows to navigate
        </p>
      } @else {
        <!-- SSR fallback: Simple grid -->
        <div class="grid grid-cols-1 gap-4">
          @for (image of images(); track $index) {
            <div class="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden">
              <a [href]="image.fullSize" target="_blank" rel="noopener noreferrer">
                <img
                  [src]="image.thumbnail"
                  [alt]="'Gallery image ' + ($index + 1)"
                  class="w-full h-full object-contain"
                />
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1200px;
      margin: 0 auto;
    }

    .gallery-container {
      position: relative;
    }

    /* Swiper navigation buttons - light mode */
    swiper-container::part(button-prev),
    swiper-container::part(button-next) {
      background-color: rgba(255, 255, 255, 0.9);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      color: #1f2937;
      transition: all 0.2s;
    }

    swiper-container::part(button-prev):hover,
    swiper-container::part(button-next):hover {
      background-color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
    }

    /* Swiper navigation buttons - dark mode */
    :host-context(.dark) swiper-container::part(button-prev),
    :host-context(.dark) swiper-container::part(button-next) {
      background-color: rgba(31, 41, 55, 0.9);
      color: #f9fafb;
    }

    :host-context(.dark) swiper-container::part(button-prev):hover,
    :host-context(.dark) swiper-container::part(button-next):hover {
      background-color: rgba(31, 41, 55, 1);
    }

    /* Pagination bullets - light mode */
    swiper-container::part(bullet) {
      background-color: rgba(31, 41, 55, 0.4);
      opacity: 1;
      transition: all 0.2s;
    }

    swiper-container::part(bullet-active) {
      background-color: #1f2937;
      transform: scale(1.2);
    }

    /* Pagination bullets - dark mode */
    :host-context(.dark) swiper-container::part(bullet) {
      background-color: rgba(249, 250, 251, 0.4);
    }

    :host-context(.dark) swiper-container::part(bullet-active) {
      background-color: #f9fafb;
    }

    /* Ensure proper spacing */
    swiper-slide {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Zoom cursor */
    .cursor-zoom-in {
      cursor: zoom-in;
    }

    .swiper-zoom-container img {
      transition: opacity 0.2s;
    }
  `,
})
export class GalleryComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  // Input signal for gallery images with thumbnail and full-size URLs
  images = input.required<GalleryImage[]>();

  @ViewChild('swiperContainer') swiperContainer?: ElementRef;

  private initialized = signal(false);

  constructor() {
    // Effect to reinitialize Swiper when images change
    effect(() => {
      const imgs = this.images();
      if (this.initialized() && imgs.length > 0) {
        this.initSwiper();
      }
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser()) {
      this.initSwiper();
      this.initialized.set(true);
    }
  }

  private async initSwiper() {
    if (!this.isBrowser() || !this.swiperContainer) {
      return;
    }

    // Dynamically import Swiper custom elements (for SSR compatibility)
    const { register } = await import('swiper/element/bundle');
    register();

    // Initialize the Swiper element
    const swiperEl = this.swiperContainer.nativeElement;
    if (swiperEl) {
      // Set parameters
      Object.assign(swiperEl, {
        navigation: true,
        pagination: {
          clickable: true,
        },
        spaceBetween: 20,
        slidesPerView: 1,
        loop: true,
        zoom: {
          maxRatio: 3,
          minRatio: 1,
        },
        keyboard: {
          enabled: true,
        },
        a11y: {
          enabled: true,
        },
      });

      // Initialize swiper
      swiperEl.initialize();
    }
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
