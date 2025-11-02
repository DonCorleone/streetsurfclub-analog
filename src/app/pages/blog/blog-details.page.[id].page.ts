import { Component, inject, computed, effect } from '@angular/core';
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

@Component({
  selector: 'app-blog-details',
  imports: [
    RouterLink,
    SafeHtmlPipe,
    NetlifyImagePipe,
    DatePipe,
    AncalNavbarComponent,
    AncalFooterComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <app-ancal-navbar />

    @if (isLoading()) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <app-loading-skeleton type="post-detail" />
      </div>
    </article>
    } @else if (page() && content()) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <!-- Back to Blog -->
        <div class="mb-[30px]">
          <a routerLink="/blog" 
             class="inline-flex items-center gap-[8px] text-[14px] md:text-[15px] text-slate-900 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-stone-900 transition-all">
            <i class="ri-arrow-left-line"></i> Back to Blog
          </a>
        </div>

        <!-- Header Image -->
        @if (content()?.headerImg) {
        <div class="mb-[30px] md:mb-[40px]">
          <img [src]="content()!.headerImg | netlifyImage:1200"
               class="w-full h-auto rounded-lg shadow-lg"
               [alt]="content()!.title"
               loading="eager">
        </div>
        }

        <!-- Post Meta -->
        <div class="mb-[20px] md:mb-[25px]">
          @if (content()?.lead) {
          <span class="text-[14px] md:text-[16px] text-slate-900 bg-amber-200 dark:bg-indigo-300 py-[1px] px-[10px] mb-[12px] inline-block">
            {{ content()!.lead }}
          </span>
          }
          @if (page()) {
          <div class="flex flex-wrap items-center gap-[15px] mt-[15px] text-[14px] md:text-[15px] text-stone-500 dark:text-yellow-400">
            <span>
              <i class="ri-calendar-line"></i> {{ page()!.published | date:'MMMM d, yyyy' }}
            </span>
            @if (page()!.author && page()!.author.displayName) {
            <span>
              <i class="ri-user-line"></i> {{ page()!.author.displayName }}
            </span>
            }
          </div>
          }
        </div>

        <!-- Title -->
        <h1 [innerHTML]="content()!.title | safeHtml"
            class="text-slate-900 dark:text-slate-300 font-bold text-[28px] md:text-[38px] lg:text-[48px] leading-[1.22] mb-[25px] md:mb-[35px]">
        </h1>

        <!-- Content -->
        <div [innerHTML]="content()!.content | safeHtml"
             class="prose prose-slate dark:prose-invert max-w-none text-[15px] md:text-[16px] leading-[1.8] text-slate-900 dark:text-slate-300">
        </div>
      </div>
    </article>
    } @else {
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-[32px] font-bold text-slate-900 dark:text-slate-300 mb-[20px]">Post Not Found</h1>
        <p class="text-[16px] text-stone-500 dark:text-yellow-400 mb-[30px]">The post you're looking for doesn't exist.</p>
        <a routerLink="/blog"
           class="inline-block text-[15px] font-semibold text-slate-900 bg-cyan-300 dark:bg-yellow-600 px-[30px] py-[14px] rounded hover:bg-amber-200 dark:hover:bg-indigo-300 transition-all">
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
