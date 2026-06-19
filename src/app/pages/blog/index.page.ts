import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
            Blog Posts
          </h1>
          <p class="text-[15px] md:text-[16px] text-muted">
            Latest news, articles, and insights
          </p>
        </div>

        @if (isLoading()) {
        <div class="grid gap-[30px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
          <app-loading-skeleton type="post-card" />
          }
        </div>
        } @else {
        <div appMasonry [columns]="masonryColumns()" [gap]="30">
          @for (item of posts(); track item.post.id) {
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
                @for (label of item.post.labels.slice().sort().slice(0, 3); track label) {
                <span class="text-[12px] bg-accent text-on-accent px-[10px] py-[3px] rounded">
                  {{ label }}
                </span>
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

  // Use the posts resource from the service
  postsResource = this.bloggerService.postsResource;

  // Signal for responsive masonry columns
  masonryColumns = signal(3);

  // Computed signal that parses posts into content
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

  // Computed loading state
  isLoading = computed(() => this.postsResource.isLoading());

  constructor() {
    // Update meta tags on initialization
    this.metaService.updateMetaTags({
      title: 'Blog - Street Surf Club',
      description: 'Latest news, articles, and insights from Street Surf Club',
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
}
