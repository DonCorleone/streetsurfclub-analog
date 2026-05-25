import {
  Component,
  input,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  effect,
  signal,
  HostListener,
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
          [attr.zoom]="!isMobile()"
          class="rounded-lg overflow-hidden"
        >
          @for (image of images(); track $index) {
            <swiper-slide>
              <div class="swiper-zoom-container aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-zoom-in">
                <a
                  [href]="isMobile() ? undefined : image.fullSize"
                  [target]="isMobile() ? undefined : '_blank'"
                  [rel]="isMobile() ? undefined : 'noopener noreferrer'"
                  (click)="openFullscreen($index, $event)"
                  class="block w-full h-full"
                  [class.cursor-pointer]="isMobile()"
                >
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
          @if (isMobile()) {
            Tap on images to view full size • Swipe or use arrows to navigate
          } @else {
            Click on images to view full size • Swipe or use arrows to navigate
          }
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

    <!-- Fullscreen Mobile Viewer -->
    @if (isFullscreen() && isMobile()) {
      <div class="fullscreen-viewer" (click)="closeFullscreen()">
        <div
          class="fullscreen-content"
          (click)="$event.stopPropagation()"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
        >
          <!-- Close button -->
          <button
            class="close-button"
            (click)="closeFullscreen()"
            aria-label="Close fullscreen viewer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Image -->
          <div class="fullscreen-image-container">
            <img
              [src]="images()[fullscreenIndex()].fullSize"
              [alt]="'Gallery image ' + (fullscreenIndex() + 1)"
              class="fullscreen-image"
            />
          </div>

          <!-- Navigation buttons -->
          <button
            class="nav-button nav-button-prev"
            (click)="previousImage()"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            class="nav-button nav-button-next"
            (click)="nextImage()"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Counter -->
          <div class="image-counter">
            {{ fullscreenIndex() + 1 }} / {{ images().length }}
          </div>
        </div>
      </div>
    }
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

    /* Fullscreen Viewer Styles */
    .fullscreen-viewer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .fullscreen-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fullscreen-image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px 80px;
    }

    .fullscreen-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      user-select: none;
      -webkit-user-select: none;
    }

    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
      background-color: rgba(255, 255, 255, 0.9);
      color: #1f2937;
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10001;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .close-button:hover {
      background-color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
    }

    .close-button:active {
      transform: scale(0.95);
    }

    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgba(255, 255, 255, 0.9);
      color: #1f2937;
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10001;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .nav-button:hover {
      background-color: rgba(255, 255, 255, 1);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-button:active {
      transform: translateY(-50%) scale(0.95);
    }

    .nav-button-prev {
      left: 16px;
    }

    .nav-button-next {
      right: 16px;
    }

    .image-counter {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
    }

    @media (max-width: 768px) {
      .fullscreen-image-container {
        padding: 70px 10px 90px;
      }

      .nav-button {
        width: 40px;
        height: 40px;
      }

      .nav-button-prev {
        left: 12px;
      }

      .nav-button-next {
        right: 12px;
      }
    }
  `,
})
export class GalleryComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  // Input signal for gallery images with thumbnail and full-size URLs
  images = input.required<GalleryImage[]>();

  @ViewChild('swiperContainer') swiperContainer?: ElementRef;

  private initialized = signal(false);

  // Fullscreen viewer state
  isFullscreen = signal(false);
  fullscreenIndex = signal(0);
  isMobile = signal(false);

  // Touch gesture tracking
  private touchStartX = 0;
  private touchEndX = 0;

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
      this.checkIfMobile();
    }
  }

  private checkIfMobile() {
    if (this.isBrowser()) {
      this.isMobile.set(window.innerWidth <= 768);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isFullscreen()) return;

    switch (event.key) {
      case 'Escape':
        this.closeFullscreen();
        break;
      case 'ArrowLeft':
        this.previousImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
    }
  }

  openFullscreen(index: number, event?: Event) {
    if (this.isMobile() && event) {
      event.preventDefault();
      this.fullscreenIndex.set(index);
      this.isFullscreen.set(true);
      // Prevent body scroll when fullscreen is open
      if (this.isBrowser()) {
        document.body.style.overflow = 'hidden';
      }
    }
  }

  closeFullscreen() {
    this.isFullscreen.set(false);
    // Restore body scroll
    if (this.isBrowser()) {
      document.body.style.overflow = '';
    }
  }

  nextImage() {
    const current = this.fullscreenIndex();
    const next = (current + 1) % this.images().length;
    this.fullscreenIndex.set(next);
  }

  previousImage() {
    const current = this.fullscreenIndex();
    const prev = (current - 1 + this.images().length) % this.images().length;
    this.fullscreenIndex.set(prev);
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - next image
        this.nextImage();
      } else {
        // Swiped right - previous image
        this.previousImage();
      }
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
