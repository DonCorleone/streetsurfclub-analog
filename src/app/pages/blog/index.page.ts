import { ChangeDetectionStrategy, Component, inject, computed, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectActivatedRoute } from '@analogjs/router';
import { map } from 'rxjs';
import { BloggerService } from '../../services/blogger.service';
import { ContentService } from '../../services/content.service';
import { MetaService } from '../../services/meta.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { NetlifyImagePipe } from '../../pipes/netlify-image.pipe';
import { IContent } from '../../models/IContent';
import { DatePipe } from '@angular/common';
import { AncalNavbarComponent } from '../../components/ancal-navbar/ancal-navbar.component';
import { AncalFooterComponent } from '../../components/ancal-footer/ancal-footer.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { MasonryDirective } from '../../directives/masonry.directive';


@Component({
  selector: 'app-blog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SafeHtmlPipe,
    NetlifyImagePipe,
    DatePipe,
    AncalNavbarComponent,
    AncalFooterComponent,
    LoadingSkeletonComponent,
    MasonryDirective
  ],
  template: `
    <app-ancal-navbar />

    <div class="py-[50px] md:py-[60px] lg:py-[80px] xl:py-[100px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px] 2xl:max-w-[1920px] 2xl:px-[30px] 3xl:px-[120px]">
        <div class="max-w-[1320px] mx-auto mb-[35px] md:mb-[45px] lg:mb-[55px] text-center">
          <h1 class="text-body font-bold text-[28px] md:text-[38px] lg:text-[50px] 2xl:text-[56px] leading-[1.22] mb-[15px]">
            Blog Beiträge
          </h1>
          <p class="text-[15px] md:text-[16px] text-muted">
            Aktuelle News, Artikel & Einblicke
          </p>
        </div>

        <!-- Search -->
        <div class="max-w-[560px] mx-auto mb-[30px] md:mb-[40px] relative">
          <div class="relative">
            <i class="ri-search-line absolute left-[14px] top-1/2 -translate-y-1/2 text-muted text-[18px] pointer-events-none"></i>
            <input
              #searchInput
              type="search"
              [value]="searchQuery()"
              (input)="onSearchInput(searchInput.value)"
              (focus)="showSuggestions.set(searchQuery().length > 0)"
              (keydown.enter)="showSuggestions.set(false)"
              (keydown.escape)="clearSearch()"
              placeholder="Suchen…"
              class="w-full bg-surface-card text-body text-[15px] pl-[42px] pr-[42px] py-[12px] rounded border border-divider focus:outline-none focus:border-accent transition-all placeholder:text-muted">
            @if (searchQuery()) {
            <button
              (mousedown)="clearSearch()"
              class="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted hover:text-body transition-all">
              <i class="ri-close-line text-[18px]"></i>
            </button>
            }
          </div>
          @if (showSuggestions() && labelSuggestions().length > 0) {
          <div class="absolute top-full left-0 right-0 mt-[4px] bg-surface-card border border-divider rounded shadow-lg z-50 overflow-hidden">
            @for (s of labelSuggestions(); track s.label) {
            <button
              (mousedown)="selectLabelSuggestion(s.label)"
              class="w-full text-left px-[16px] py-[10px] text-[14px] text-body hover:bg-accent hover:text-on-accent transition-all flex items-center justify-between gap-[8px]">
              <span><i class="ri-price-tag-3-line mr-[8px] opacity-40"></i>{{ s.label }}</span>
              <span class="text-[12px] opacity-40 shrink-0">{{ s.count }}</span>
            </button>
            }
          </div>
          }
        </div>

        @if (!isLoading() && topLabels().length > 0 && !searchQuery()) {
        <div class="max-w-[1320px] mx-auto mb-[30px] md:mb-[40px] flex flex-wrap gap-[10px] justify-center items-center">
          @for (item of visibleLabels(); track item.label) {
          <button
            (click)="selectedLabel.set(item.label); showAllLabels.set(false)"
            [class]="selectedLabel() === item.label
              ? 'text-[13px] font-semibold px-[16px] py-[6px] rounded-full bg-accent text-on-accent transition-all'
              : 'text-[13px] font-semibold px-[16px] py-[6px] rounded-full bg-surface-card text-muted hover:text-body transition-all'">
            {{ item.label }}
            <span [class]="selectedLabel() === item.label
              ? 'ml-[5px] text-[11px] opacity-75'
              : 'ml-[5px] text-[11px] opacity-50'">{{ item.count }}</span>
          </button>
          }
          @if (!showAllLabels() && hasMoreLabels()) {
          <button
            (click)="showAllLabels.set(true)"
            class="self-center text-[13px] text-muted underline underline-offset-2 hover:text-body transition-all">
            Mehr anzeigen <i class="ri-arrow-down-s-line"></i>
          </button>
          }
          @if (showAllLabels()) {
          <button
            (click)="showAllLabels.set(false)"
            class="self-center text-[13px] text-muted underline underline-offset-2 hover:text-body transition-all">
            Weniger anzeigen <i class="ri-arrow-up-s-line"></i>
          </button>
          }
        </div>
        }

        @if (isLoading()) {
        <div class="grid gap-[30px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
          <app-loading-skeleton type="post-card" />
          }
        </div>
        } @else if (displayedPosts().length === 0 && (searchQuery() || selectedLabel())) {
        <div class="text-center py-[60px] text-muted text-[16px]">
          @if (searchQuery()) {
            Keine Beiträge für „{{ searchQuery() }}" gefunden.
          } @else {
            Keine Beiträge mit dem Label „{{ selectedLabel() }}" gefunden.
          }
        </div>
        } @else {
        <div appMasonry [columns]="masonryColumns()" [gap]="30">
          @for (item of displayedPosts(); track item.post.id) {
          <a [routerLink]="['/blog/blog-details/post', item.post.id]"
             class="group bg-surface-card transition-all hover:shadow-lg block cursor-pointer">
            @if (item.content.headerImg) {
            <div class="overflow-hidden">
              <img [src]="item.content.headerImg | netlifyImage:600"
                   class="w-full h-auto transition-all group-hover:scale-110"
                   [alt]="item.content.title"
                   loading="lazy">
            </div>
            }
            <div class="py-[25px] px-[25px] md:py-[30px] md:px-[30px]">
              <div class="flex items-center gap-[15px] mb-[15px]">
                <span class="text-[13px] md:text-[14px] text-muted">
                  <i class="ri-calendar-line"></i> {{ item.post.published | date:'MMM d, yyyy' }}
                </span>
                @if (item.post.author && item.post.author.displayName) {
                <span class="text-[13px] md:text-[14px] text-muted">
                  <i class="ri-user-line"></i> {{ item.post.author.displayName }}
                </span>
                }
              </div>
              <h2 class="text-[20px] md:text-[22px] lg:text-[24px] font-bold leading-[1.3] mb-[15px] text-body transition-all group-hover:text-hover-highlight"
                  [innerHTML]="item.content.title | safeHtml">
              </h2>
              @if (item.content.preview) {
              <p class="text-[14px] md:text-[15px] text-muted mb-[18px] line-clamp-3">
                {{ item.content.preview }}...
              </p>
              }
              @if (item.post.labels && item.post.labels.length > 0) {
              <div class="flex flex-wrap gap-[8px] mb-[18px]">
                @for (label of item.post.labels.slice().sort(); track label) {
                <button
                  (click)="$event.preventDefault(); $event.stopPropagation(); selectedLabel.set(label)"
                  [class]="selectedLabel() === label
                    ? 'text-[12px] bg-accent text-on-accent px-[10px] py-[3px] rounded cursor-pointer'
                    : 'text-[12px] bg-surface-card text-muted px-[10px] py-[3px] rounded cursor-pointer hover:bg-accent hover:text-on-accent transition-all'">
                  {{ label }} <span class="opacity-60">({{ labelCounts().get(label) ?? 0 }})</span>
                </button>
                }
              </div>
              }
              <span class="inline-block text-[14px] md:text-[15px] font-semibold text-body transition-all group-hover:text-hover-highlight">
                Weiterlesen <i class="ri-arrow-right-line"></i>
              </span>
            </div>
          </a>
          }
        </div>
        }
      </div>
    </div>

    <app-ancal-footer />
  `
})
export default class BlogComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private metaService = inject(MetaService);
  private route = injectActivatedRoute();
  private queryLabel = toSignal(this.route.queryParams.pipe(map(p => (p['label'] as string) ?? null)));

  postsResource = this.bloggerService.postsResource;

  masonryColumns = signal(3);
  selectedLabel = signal<string | null>(null);
  showAllLabels = signal(false);
  searchQuery = signal('');
  showSuggestions = signal(false);

  private labelLimit = computed(() => this.masonryColumns() === 1 ? 8 : 18);

  posts = computed(() => {
    const rawPosts = this.postsResource.value();
    if (!rawPosts) return [];
    return rawPosts
      .map(post => {
        const content = this.contentService.parseContent(post);
        return content ? { post, content } : null;
      })
      .filter((item): item is { post: any; content: IContent } => item !== null);
  });

  labelCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const { post } of this.posts()) {
      for (const label of post.labels ?? []) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return counts;
  });

  topLabels = computed(() =>
    [...this.labelCounts().entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }))
  );

  private allLabelsAlpha = computed(() =>
    [...this.labelCounts().entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }))
  );

  visibleLabels = computed(() => {
    const selected = this.selectedLabel();

    if (this.showAllLabels()) {
      const all = this.allLabelsAlpha();
      if (!selected) return all;
      const selectedItem = all.find(l => l.label === selected);
      if (!selectedItem) return all;
      return [selectedItem, ...all.filter(l => l.label !== selected)];
    }

    const all = this.topLabels();
    const limit = this.labelLimit();
    const selectedItem = selected ? all.find(l => l.label === selected) : null;
    const rest = selectedItem ? all.filter(l => l.label !== selected) : all;
    const sliced = rest.slice(0, selectedItem ? limit - 1 : limit);
    return selectedItem ? [selectedItem, ...sliced] : sliced;
  });

  hasMoreLabels = computed(() =>
    !this.showAllLabels() && this.topLabels().length > this.visibleLabels().length
  );

  labelSuggestions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.allLabelsAlpha().filter(l => l.label.toLowerCase().includes(q)).slice(0, 8);
  });

  displayedPosts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      return this.posts().filter(({ post, content }) =>
        content.title?.toLowerCase().includes(q) ||
        content.preview?.toLowerCase().includes(q) ||
        post.author?.displayName?.toLowerCase().includes(q) ||
        (post.labels ?? []).some((l: string) => l.toLowerCase().includes(q))
      );
    }
    const label = this.selectedLabel();
    if (!label) return this.posts();
    return this.posts().filter(({ post }) => post.labels?.includes(label));
  });

  isLoading = computed(() => this.postsResource.isLoading());

  constructor() {
    effect(() => {
      const label = this.queryLabel();
      if (label) this.selectedLabel.set(label);
    });

    // Update meta tags on initialization
    this.metaService.updateMetaTags({
      title: 'Blog - Street Surf Club',
      description: 'Aktuelle News, Artikel und Einblicke vom Street Surf Club',
      image: ''
    });

    // Set up responsive columns (browser only)
    if (typeof window !== 'undefined') {
      this.updateColumns();
      window.addEventListener('resize', () => this.updateColumns());
    }
  }

  private updateColumns() {
    const width = window.innerWidth;
    if (width < 768) {
      this.masonryColumns.set(1);
    } else if (width < 1024) {
      this.masonryColumns.set(2);
    } else {
      this.masonryColumns.set(3);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.showSuggestions.set(value.length > 0);
    this.selectedLabel.set(null);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.showSuggestions.set(false);
  }

  selectLabelSuggestion(label: string): void {
    this.selectedLabel.set(label);
    this.clearSearch();
    this.showAllLabels.set(false);
  }

}
