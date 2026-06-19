import { ChangeDetectionStrategy, Component, inject, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { injectActivatedRoute } from '@analogjs/router';
import { from, map, Observable, of } from 'rxjs';
import { BloggerService } from '../../services/blogger.service';
import { ContentService } from '../../services/content.service';
import { MetaService } from '../../services/meta.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { NetlifyImagePipe } from '../../pipes/netlify-image.pipe';
import { IContent } from '../../models/IContent';
import { Post } from '../../models/posts';
import { DatePipe } from '@angular/common';
import { AncalNavbarComponent } from '../../components/ancal-navbar/ancal-navbar.component';
import { AncalFooterComponent } from '../../components/ancal-footer/ancal-footer.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { ContentRendererComponent } from '../../components/content-renderer/content-renderer.component';

const RELATED_COUNT = 3;

@Component({
  selector: 'app-blog-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SafeHtmlPipe,
    NetlifyImagePipe,
    DatePipe,
    AncalNavbarComponent,
    AncalFooterComponent,
    LoadingSkeletonComponent,
    ContentRendererComponent
  ],
  template: `
    <app-ancal-navbar />

    @if (isLoading()) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <app-loading-skeleton type="post-detail" />
      </div>
    </article>
    } @else if (post() && content()) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <!-- Back to Blog -->
        <div class="mb-[30px]">
          <a routerLink="/blog"
             class="inline-flex items-center gap-[8px] text-[14px] md:text-[15px] text-body hover:text-hover-highlight transition-all">
            <i class="ri-arrow-left-line"></i> Back to Blog
          </a>
        </div>

        <!-- Header Image -->
        @if (content()?.headerImg) {
        <div class="mb-[30px] md:mb-[40px] max-w-[800px] mx-auto">
          <img [src]="content()!.headerImg | netlifyImage:1200"
               class="w-full h-auto rounded-lg shadow-lg"
               [alt]="content()!.title"
               loading="eager">
        </div>
        }

        <!-- Post Meta -->
        <div class="mb-[20px] md:mb-[25px]">
          @if (content()?.lead) {
          <span class="text-[14px] md:text-[16px] text-on-accent bg-accent py-[1px] px-[10px] mb-[12px] inline-block">
            {{ content()!.lead }}
          </span>
          }
          @if (post()) {
          <div class="flex flex-wrap items-center gap-[15px] mt-[15px] text-[14px] md:text-[15px] text-muted">
            <span>
              <i class="ri-calendar-line"></i> {{ post()!.published | date:'MMMM d, yyyy' }}
            </span>
            @if (post()!.author && post()!.author.displayName) {
            <span>
              <i class="ri-user-line"></i> {{ post()!.author.displayName }}
            </span>
            }
          </div>
          }
        </div>

        <!-- Title -->
        <h1 [innerHTML]="content()!.title | safeHtml"
            class="text-body font-bold text-[28px] md:text-[38px] lg:text-[48px] leading-[1.22] mb-[25px] md:mb-[35px]">
        </h1>

        <!-- Content -->
        <app-content-renderer [htmlContent]="content()!.content" />

        <!-- Labels/Tags -->
        @if (post()?.labels && (post()?.labels?.length ?? 0) > 0) {
        <div class="mt-[40px] pt-[30px] border-t border-divider">
          <h3 class="text-[18px] font-bold text-body mb-[15px]">Tags:</h3>
          <div class="flex flex-wrap gap-[10px]">
            @for (label of post()!.labels!.slice().sort(); track label) {
            <a [routerLink]="['/blog']" [queryParams]="{label: label}"
               class="text-[13px] md:text-[14px] bg-accent text-on-accent px-[15px] py-[5px] rounded hover:opacity-80 transition-all">
              {{ label }} <span class="opacity-60">({{ labelCounts().get(label) ?? 0 }})</span>
            </a>
            }
          </div>
        </div>
        }

        <!-- Related Posts Section -->
        @if (relatedPosts().length > 0) {
        <div class="mt-[60px] md:mt-[80px]">
          <h2 class="text-[24px] md:text-[28px] font-bold text-body mb-[30px]">
            Ähnliche Beiträge
          </h2>
          <div class="grid gap-[25px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-[1fr]">
            @for (item of relatedPosts(); track item.post.id) {
            <a [routerLink]="['/blog/blog-details/post', item.post.id]"
               class="group bg-surface-card transition-all hover:shadow-lg flex flex-col cursor-pointer">
              @if (item.content.headerImg) {
              <div class="overflow-hidden flex-shrink-0">
                <img [src]="item.content.headerImg | netlifyImage:600"
                     class="w-full h-auto transition-all group-hover:scale-110"
                     [alt]="item.content.title"
                     loading="lazy">
              </div>
              }
              <div class="p-[20px] flex-grow flex flex-col">
                <h3 class="text-[16px] md:text-[18px] font-bold leading-[1.3] mb-[10px] text-body transition-all group-hover:text-hover-highlight"
                    [innerHTML]="item.content.title | safeHtml">
                </h3>
                @if (item.content.preview) {
                <p class="text-[13px] md:text-[14px] text-muted mb-[12px] line-clamp-2 flex-grow">
                  {{ item.content.preview }}...
                </p>
                }
                <span class="inline-block text-[13px] md:text-[14px] font-semibold text-body transition-all group-hover:text-hover-highlight mt-auto">
                  Weiterlesen <i class="ri-arrow-right-line"></i>
                </span>
              </div>
            </a>
            }
          </div>
        </div>
        }
      </div>
    </article>
    } @else {
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-[32px] font-bold text-body mb-[20px]">Post Not Found</h1>
        <p class="text-[16px] text-muted mb-[30px]">The post you're looking for doesn't exist.</p>
        <a routerLink="/blog"
           class="inline-block text-[15px] font-semibold text-on-cta bg-cta px-[30px] py-[14px] rounded hover:bg-accent hover:text-on-accent transition-all">
          Back to Blog
        </a>
      </div>
    </div>
    }

    <app-ancal-footer />
  `
})
export default class BlogDetailsComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private metaService = inject(MetaService);

  // Use Analog's injectActivatedRoute for SSR-safe route access
  readonly route = injectActivatedRoute();

  // Convert route params to a signal
  private postId = toSignal(
    this.route.params.pipe(map(params => params['id'] as string))
  );

  // Resource for loading the current post
  postResource = rxResource<Post | null, string | undefined>({
    params: () => this.postId(),
    stream: ({ params: postId }): Observable<Post | null> => {
      if (!postId) return of(null);
      return from(this.bloggerService.loadPost(postId));
    }
  });

  // Computed post value for easier access in template
  post = computed<Post | null | undefined>(() => this.postResource.value() as Post | null | undefined);

  // Computed content from post
  content = computed(() => {
    const post = this.postResource.value();
    return post ? this.contentService.parseContent(post) : null;
  });

  labelCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const post of this.bloggerService.postsResource.value() ?? []) {
      for (const label of post.labels ?? []) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return counts;
  });

  // IDF-weighted similarity: rare shared labels count more than common ones
  relatedPosts = computed(() => {
    const allPosts = this.bloggerService.postsResource.value();
    const currentPost = this.post();
    const counts = this.labelCounts();
    if (!allPosts || !currentPost) return [];

    const currentLabels = new Set(currentPost.labels ?? []);

    return allPosts
      .filter(p => p.id !== currentPost.id)
      .map(post => {
        // Only labels that exist on both posts and have count > 1 (count=1 means no other post can match)
        const sharedLabels = (post.labels ?? []).filter(l => currentLabels.has(l) && (counts.get(l) ?? 0) > 1);
        const score = sharedLabels.reduce((sum, l) => sum + 1 / (counts.get(l) ?? 1), 0);
        return { post, sharedLabels, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RELATED_COUNT)
      .map(({ post, sharedLabels, score }) => {
        const content = this.contentService.parseContent(post);
        return content ? { post, content, sharedLabels, score } : null;
      })
      .filter((item): item is { post: Post; content: IContent; sharedLabels: string[]; score: number } => item !== null);
  });

  // Computed loading state
  isLoading = computed(() => this.postResource.isLoading());

  constructor() {
    // Effect to update meta tags when content changes
    effect(() => {
      const contentData = this.content();
      if (contentData) {
        this.metaService.updateMetaTags({
          title: contentData.title,
          description: contentData.lead || contentData.title,
          image: contentData.headerImg || ''
        });
      }
    });
  }
}
