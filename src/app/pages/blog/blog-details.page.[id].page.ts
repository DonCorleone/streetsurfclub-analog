import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectActivatedRoute } from '@analogjs/router';
import { BloggerService } from '../../services/blogger.service';
import { ContentService } from '../../services/content.service';
import { MetaService } from '../../services/meta.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { Page } from '../../models/pages';
import { Post } from '../../models/posts';
import { IContent } from '../../models/IContent';
import { map, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AncalNavbarComponent } from '../../components/ancal-navbar/ancal-navbar.component';
import { AncalFooterComponent } from '../../components/ancal-footer/ancal-footer.component';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-blog-details',
  imports: [
    RouterLink,
    SafeHtmlPipe,
    DatePipe,
    AncalNavbarComponent,
    AncalFooterComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <app-ancal-navbar />
    
    @if (isLoading) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <app-loading-skeleton type="post-detail" />
      </div>
    </article>
    } @else if (post && content) {
    <article class="py-[50px] md:py-[60px] lg:py-[80px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]">
        <!-- Back to Blog -->
        <div class="mb-[30px]">
          <a routerLink="/blog" 
             class="inline-flex items-center gap-[8px] text-[14px] md:text-[15px] text-slate-900 hover:text-cyan-500 transition-all">
            <i class="ri-arrow-left-line"></i> Back to Blog
          </a>
        </div>

        <!-- Header Image -->
        @if (content.headerImg) {
        <div class="mb-[30px] md:mb-[40px]">
          <img [src]="content.headerImg" 
               class="w-full h-auto rounded-lg shadow-lg" 
               [alt]="content.title">
        </div>
        }

        <!-- Post Meta -->
        <div class="mb-[20px] md:mb-[25px]">
          @if (content.lead) {
          <span class="text-[14px] md:text-[16px] text-slate-900 bg-amber-200 py-[1px] px-[10px] mb-[12px] inline-block">
            {{ content.lead }}
          </span>
          }
          <div class="flex flex-wrap items-center gap-[15px] mt-[15px] text-[14px] md:text-[15px] text-stone-500">
            <span>
              <i class="ri-calendar-line"></i> {{ post.published | date:'MMMM d, yyyy' }}
            </span>
            @if (post.author && post.author.displayName) {
            <span>
              <i class="ri-user-line"></i> {{ post.author.displayName }}
            </span>
            }
          </div>
        </div>

        <!-- Title -->
        <h1 [innerHTML]="content.title | safeHtml"
            class="text-slate-900 font-bold text-[28px] md:text-[38px] lg:text-[48px] leading-[1.22] mb-[25px] md:mb-[35px]">
        </h1>

        <!-- Content -->
        <div [innerHTML]="content.content | safeHtml"
             class="prose prose-slate max-w-none text-[15px] md:text-[16px] leading-[1.8] text-slate-900">
        </div>

        <!-- Related Posts Section -->
        @if (relatedPosts.length > 0) {
        <div class="mt-[60px] md:mt-[80px]">
          <h2 class="text-[24px] md:text-[28px] font-bold text-slate-900 mb-[30px]">
            Related Posts
          </h2>
          <div class="grid gap-[25px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            @for (item of relatedPosts; track item.post.id) {
            <div class="group bg-white transition-all hover:shadow-lg">
              @if (item.content.headerImg) {
              <div class="overflow-hidden">
                <a [routerLink]="['/blog/blog-details/post', item.post.id]">
                  <img [src]="item.content.headerImg" 
                       class="w-full h-[180px] object-cover transition-all group-hover:scale-110" 
                       [alt]="item.content.title">
                </a>
              </div>
              }
              <div class="p-[20px]">
                <h3 class="text-[16px] md:text-[18px] font-bold leading-[1.3] mb-[10px]">
                  <a [routerLink]="['/blog/blog-details/post', item.post.id]" 
                     class="text-slate-900 transition-all hover:text-cyan-500"
                     [innerHTML]="item.content.title | safeHtml">
                  </a>
                </h3>
                @if (item.content.lead) {
                <p class="text-[13px] md:text-[14px] text-stone-500 mb-[12px] line-clamp-2">
                  {{ item.content.lead }}
                </p>
                }
                <a [routerLink]="['/blog/blog-details/post', item.post.id]" 
                   class="inline-block text-[13px] md:text-[14px] font-semibold text-slate-900 transition-all hover:text-cyan-500">
                  Read More <i class="ri-arrow-right-line"></i>
                </a>
              </div>
            </div>
            }
          </div>
        </div>
        }
      </div>
    </article>
    } @else {
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-[32px] font-bold text-slate-900 mb-[20px]">Post Not Found</h1>
        <p class="text-[16px] text-stone-500 mb-[30px]">The post you're looking for doesn't exist.</p>
        <a routerLink="/blog" 
           class="inline-block text-[15px] font-semibold text-white bg-cyan-500 px-[30px] py-[14px] rounded hover:bg-cyan-600 transition-all">
          Back to Blog
        </a>
      </div>
    </div>
    }
    
    <app-ancal-footer />
  `
})
export default class BlogDetailsComponent implements OnInit {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private metaService = inject(MetaService);

  // Use Analog's injectActivatedRoute for SSR-safe route access
  readonly route = injectActivatedRoute();

  post: Page | null = null;
  content: IContent | null = null;
  relatedPosts: Array<{ post: Post; content: IContent }> = [];
  isLoading = true;

  ngOnInit(): void {
    // Subscribe to route parameter changes to handle navigation between pages
    this.route.params.subscribe(params => {
      const id = params['id'];

      if (!id) {
        console.error('No page ID found in route params');
        this.isLoading = false;
        return;
      }

      // Reset loading state when navigating
      this.isLoading = true;

      // Fetch page data
      this.bloggerService.getPage(id).pipe(
        take(1)
      ).subscribe(post => {
        if (post) {
          this.post = post;
          this.content = this.contentService.parseContent(post);

          // Update meta tags
          if (this.content) {
            this.metaService.updateMetaTags({
              title: this.content.title,
              description: this.content.lead || this.content.title,
              image: this.content.headerImg || ''
            });
          }

          // Load related posts
          this.loadRelatedPosts();
        }
        this.isLoading = false;
      });
    });
  }

  private loadRelatedPosts(): void {
    this.bloggerService.getPosts(4).pipe(
      take(1),
      map(posts => {
        // Filter out current post and get first 3
        const filtered = posts
          .filter(p => p.id !== this.post?.id)
          .slice(0, 3);
        
        this.relatedPosts = filtered
          .map(post => {
            const content = this.contentService.parseContent(post);
            return content ? { post, content } : null;
          })
          .filter((item): item is { post: Post; content: IContent } => item !== null);
      })
    ).subscribe();
  }
}
