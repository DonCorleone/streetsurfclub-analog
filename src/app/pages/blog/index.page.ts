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
import { NbButton, NbCard, NbCardActions, NbCardContent, NbCardHeader, NbChip, NbChipGroup } from '@ng-brutalism/ui';

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
    MasonryDirective,
    NbButton,
    NbCard,
    NbCardActions,
    NbCardContent,
    NbCardHeader,
    NbChip,
    NbChipGroup,
  ],
  template: `
    <app-ancal-navbar />

    <div class="py-12 md:py-16 lg:py-20 bg-[var(--nb-background)]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">

        <div class="mb-10 md:mb-14">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight mb-3">
            Blog Posts
          </h1>
          <p class="text-sm font-bold uppercase tracking-widest opacity-60">
            News, Artikel und Einblicke
          </p>
        </div>

        @if (isLoading()) {
        <div class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
          <app-loading-skeleton type="post-card" />
          }
        </div>
        } @else {
        <div appMasonry [columns]="masonryColumns()" [gap]="24">
          @for (item of posts(); track item.post.id) {
          <a [routerLink]="['/blog/blog-details/post', item.post.id]" class="block group mb-6">
            <nb-card tone="default" shadow="default" border="default" class="h-full! transition-transform hover:-translate-y-1">
              @if (item.content.headerImg) {
              <nb-card-header class="p-0! overflow-hidden">
                <img [src]="item.content.headerImg | netlifyImage:600"
                     class="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                     [alt]="item.content.title"
                     loading="lazy">
              </nb-card-header>
              }
              <nb-card-content class="flex flex-col gap-3">
                <div class="flex items-center gap-4">
                  <p class="text-xs font-bold uppercase tracking-widest opacity-60">
                    {{ item.post.published | date:'MMM d, yyyy' }}
                  </p>
                  @if (item.post.author?.displayName) {
                  <p class="text-xs font-bold uppercase tracking-widest opacity-60">
                    {{ item.post.author.displayName }}
                  </p>
                  }
                </div>
                <h2 class="text-xl md:text-2xl font-black uppercase leading-tight"
                    [innerHTML]="item.content.title | safeHtml">
                </h2>
                @if (item.content.preview) {
                <p class="text-sm opacity-70 line-clamp-3">
                  {{ item.content.preview }}...
                </p>
                }
                @if (item.post.labels && item.post.labels.length > 0) {
                <div nbChipGroup gap="sm" class="flex-wrap">
                  @for (label of item.post.labels.slice(0, 3); track label) {
                    <span nbChip tone="blue" class="text-[10px]! font-black! uppercase!">{{ label }}</span>
                  }
                </div>
                }
              </nb-card-content>
              <nb-card-actions>
                <button nbButton tone="yellow" shadow="default" class="w-full! font-black! uppercase tracking-widest! text-xs!">
                  Weiterlesen →
                </button>
              </nb-card-actions>
            </nb-card>
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
