import { Directive, ElementRef, AfterViewInit, OnDestroy, inject, effect, input } from '@angular/core';

@Directive({
  selector: '[appMasonry]',
})
export class MasonryDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId?: number;

  // Gap between items in pixels
  gap = input<number>(30);
  // Number of columns
  columns = input<number>(3);

  constructor() {
    // Watch for column changes
    effect(() => {
      this.columns();
      if (typeof window !== 'undefined') {
        // Re-layout on column change
        this.scheduleLayout();
      }
    });
  }

  ngAfterViewInit() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    this.initMasonry();
    this.observeChanges();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private initMasonry() {
    const container = this.elementRef.nativeElement as HTMLElement;

    // Set up container
    container.style.position = 'relative';

    // Wait for images to load before calculating positions
    this.waitForImages(container).then(() => {
      this.layoutItems();
    });
  }

  private scheduleLayout() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.layoutItems();
    });
  }

  private layoutItems() {
    const container = this.elementRef.nativeElement as HTMLElement;
    const items = Array.from(container.children) as HTMLElement[];

    if (items.length === 0) return;

    const cols = this.columns();
    const gap = this.gap();
    const containerWidth = container.offsetWidth;
    const columnWidth = (containerWidth - (gap * (cols - 1))) / cols;

    // Track height of each column
    const columnHeights = new Array(cols).fill(0);

    items.forEach((item) => {
      // Reset positioning
      item.style.position = 'absolute';
      item.style.width = `${columnWidth}px`;

      // Force reflow to get accurate height with new width
      item.offsetHeight;

      const itemHeight = item.getBoundingClientRect().height;

      // Find shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = columnHeights[shortestColumnIndex];

      // Position the item
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;

      // Update column height
      columnHeights[shortestColumnIndex] += itemHeight + gap;
    });

    // Set container height to tallest column
    const containerHeight = Math.max(...columnHeights);
    container.style.height = `${containerHeight}px`;
  }

  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img'));

    if (images.length === 0) {
      return Promise.resolve();
    }

    const imagePromises = images.map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    });

    await Promise.all(imagePromises);
  }

  private observeChanges() {
    const container = this.elementRef.nativeElement as HTMLElement;

    // Observe size changes (e.g., when images load)
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleLayout();
    });

    // Observe each child element
    Array.from(container.children).forEach(child => {
      this.resizeObserver?.observe(child as HTMLElement);
    });

    // Observe DOM changes (new items added)
    this.mutationObserver = new MutationObserver(() => {
      this.waitForImages(container).then(() => {
        this.scheduleLayout();
      });

      // Observe new children
      Array.from(container.children).forEach(item => {
        if (!this.resizeObserver) return;
        this.resizeObserver.observe(item as HTMLElement);
      });
    });

    this.mutationObserver.observe(container, {
      childList: true
    });
  }
}
