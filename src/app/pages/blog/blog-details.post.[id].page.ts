import { ChangeDetectionStrategy, Component, inject, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { injectActivatedRoute } from '@analogjs/router';
import { map, from, Observable, of } from 'rxjs';
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
import { NbButton, NbCard, NbCardContent, NbCardHeader, NbChip, NbChipGroup } from '@ng-brutalism/ui';

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
    ContentRendererComponent,
    NbButton,
    NbCard,
    NbCardContent,
    NbCardHeader,
    NbChip,
    NbChipGroup,
  ],
  template: `
    <app-ancal-navbar />

    @if (isLoading()) {
    <article class="py-12 md:py-16 lg:py-20">
      <div class="max-w-[860px] mx-auto px-4 sm:px-6">
        <app-loading-skeleton type="post-detail" />
      </div>
    </article>
    } @else if (post() && content()) {
    <article class="py-12 md:py-16 lg:py-20 bg-[var(--nb-background)]">
      <div class="max-w-[860px] mx-auto px-4 sm:px-6">

        <!-- Back -->
        <div class="mb-8">
          <a routerLink="/blog" nbButton tone="default" border="default"
             class="font-black! uppercase tracking-widest! text-xs!">
            ← Zurück zum Blog
          </a>
        </div>

        <!-- Header image -->
        @if (content()?.headerImg) {
        <div class="mb-8 md:mb-12">
          <img [src]="content()!.headerImg | netlifyImage:1200"
               class="w-full h-auto border-[length:var(--nb-border-width)] border-[color:var(--nb-border)] shadow-[5px_5px_0px_var(--nb-shadow)]"
               [alt]="content()!.title"
               loading="eager">
        </div>
        }

        <!-- Meta + lead -->
        <div class="mb-6 flex flex-wrap items-center gap-4">
          @if (content()?.lead) {
          <span nbChip tone="yellow" shadow="default" border="default" class="uppercase font-black! tracking-widest! text-xs!">
            {{ content()!.lead }}
          </span>
          }
          <span class="text-xs font-bold uppercase tracking-widest opacity-60">
            {{ post()!.published | date:'MMMM d, yyyy' }}
          </span>
          @if (post()!.author?.displayName) {
          <span class="text-xs font-bold uppercase tracking-widest opacity-60">
            {{ post()!.author.displayName }}
          </span>
          }
        </div>

        <!-- Title -->
        <h1 [innerHTML]="content()!.title | safeHtml"
            class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-[1.05] mb-8 md:mb-12">
        </h1>

        <!-- Content -->
        <app-content-renderer [htmlContent]="content()!.content" />

        <!-- Tags -->
        @if (post()?.labels && (post()?.labels?.length ?? 0) > 0) {
        <div class="mt-10 pt-8 border-t-[length:var(--nb-border-width)] border-[color:var(--nb-border)]">
          <p class="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Tags</p>
          <div nbChipGroup gap="sm" class="flex-wrap">
            @for (label of post()!.labels; track label) {
              <span nbChip tone="blue" border="default" class="text-xs! font-black! uppercase!">{{ label }}</span>
            }
          </div>
        </div>
        }

        <!-- Related posts -->
        @if (relatedPosts().length > 0) {
        <div class="mt-16 md:mt-20">
          <h2 class="text-2xl md:text-3xl font-black uppercase mb-8">
            Ähnliche Beiträge
          </h2>
          <div class="grid gap-6 grid-cols-1 md:grid-cols-3">
            @for (item of relatedPosts(); track item.post.id) {
            <a [routerLink]="['/blog/blog-details/post', item.post.id]" class="block group">
              <nb-card tone="default" shadow="default" border="default" class="h-full! transition-transform hover:-translate-y-1">
                @if (item.content.headerImg) {
                <nb-card-header class="p-0! overflow-hidden">
                  <img [src]="item.content.headerImg | netlifyImage:600"
                       class="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                       [alt]="item.content.title"
                       loading="lazy">
                </nb-card-header>
                }
                <nb-card-content>
                  <h3 class="text-sm font-black uppercase leading-tight"
                      [innerHTML]="item.content.title | safeHtml">
                  </h3>
                  @if (item.content.preview) {
                  <p class="text-xs opacity-60 line-clamp-2 mt-2">{{ item.content.preview }}...</p>
                  }
                </nb-card-content>
              </nb-card>
            </a>
            }
          </div>
        </div>
        }

      </div>
    </article>
    } @else {
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <h1 class="text-4xl font-black uppercase mb-4">Post nicht gefunden</h1>
        <p class="text-sm uppercase font-bold tracking-widest opacity-60 mb-8">
          Der gesuchte Beitrag existiert nicht.
        </p>
        <a routerLink="/blog" nbButton tone="yellow" shadow="default" border="default"
           class="font-black! uppercase tracking-widest! text-sm!">
          Zurück zum Blog →
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

  // Resource for related posts
  relatedPostsResource = rxResource<Post[], string | undefined>({
    params: () => this.postId(),
    stream: (): Observable<Post[]> => from(this.bloggerService.loadPostsWithLimit(4))
  });

  // Computed related posts (filtered and parsed)
  relatedPosts = computed(() => {
    const posts = this.relatedPostsResource.value();
    const currentId = this.postId();
    if (!posts) return [];

    // Filter out current post and get first 3
    const filtered = posts
      .filter(p => p.id !== currentId)
      .slice(0, 3);

    return filtered
      .map(post => {
        const content = this.contentService.parseContent(post);
        return content ? { post, content } : null;
      })
      .filter((item): item is { post: any; content: IContent } => item !== null);
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
