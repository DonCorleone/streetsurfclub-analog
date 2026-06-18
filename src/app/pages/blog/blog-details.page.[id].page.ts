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
import { Page } from '../../models/pages';
import { DatePipe } from '@angular/common';
import { AncalNavbarComponent } from '../../components/ancal-navbar/ancal-navbar.component';
import { AncalFooterComponent } from '../../components/ancal-footer/ancal-footer.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';
import { ContentRendererComponent } from '../../components/content-renderer/content-renderer.component';
import { NbButton, NbChip } from '@ng-brutalism/ui';

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
    NbChip,
  ],
  template: `
    <app-ancal-navbar />

    @if (isLoading()) {
    <article class="py-12 md:py-16 lg:py-20">
      <div class="max-w-[860px] mx-auto px-4 sm:px-6">
        <app-loading-skeleton type="post-detail" />
      </div>
    </article>
    } @else if (page() && content()) {
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
            {{ page()!.published | date:'MMMM d, yyyy' }}
          </span>
          @if (page()!.author?.displayName) {
          <span class="text-xs font-bold uppercase tracking-widest opacity-60">
            {{ page()!.author.displayName }}
          </span>
          }
        </div>

        <!-- Title -->
        <h1 [innerHTML]="content()!.title | safeHtml"
            class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase leading-[1.05] mb-8 md:mb-12">
        </h1>

        <!-- Content -->
        <app-content-renderer [htmlContent]="content()!.content" />

      </div>
    </article>
    } @else {
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <h1 class="text-4xl font-black uppercase mb-4">Seite nicht gefunden</h1>
        <p class="text-sm uppercase font-bold tracking-widest opacity-60 mb-8">
          Die gesuchte Seite existiert nicht.
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
  private pageId = toSignal(
    this.route.params.pipe(map(params => params['id'] as string))
  );

  // Resource for loading the current page
  pageResource = rxResource<Page | null, string | undefined>({
    params: () => this.pageId(),
    stream: ({ params: pageId }): Observable<Page | null> => {
      if (!pageId) return of(null);
      return from(this.bloggerService.loadPage(pageId));
    }
  });

  // Computed page value for easier access in template
  page = computed<Page | null | undefined>(() => this.pageResource.value());

  // Computed content from page
  content = computed(() => {
    const page = this.pageResource.value();
    return page ? this.contentService.parseContent(page) : null;
  });

  // Computed loading state
  isLoading = computed(() => this.pageResource.isLoading());

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
