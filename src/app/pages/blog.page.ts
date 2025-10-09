import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloggerService } from '../services/blogger.service';
import { ContentService } from '../services/content.service';
import { MetaService } from '../services/meta.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { Post } from '../models/posts';
import { IContent } from '../models/IContent';
import { map, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AncalNavbarComponent } from '../components/ancal-navbar/ancal-navbar.component';
import { AncalFooterComponent } from '../components/ancal-footer/ancal-footer.component';
import { LoadingSkeletonComponent } from '../components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-blog',
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
    
    <div class="py-[50px] md:py-[60px] lg:py-[80px] xl:py-[100px]">
      <div class="mx-auto px-[12px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px] 2xl:max-w-[1920px] 2xl:px-[30px] 3xl:px-[120px]">
        <div class="max-w-[1320px] mx-auto mb-[35px] md:mb-[45px] lg:mb-[55px] text-center">
          <h1 class="text-slate-900 font-bold text-[28px] md:text-[38px] lg:text-[50px] 2xl:text-[56px] leading-[1.22] mb-[15px]">
            Blog Posts
          </h1>
          <p class="text-[15px] md:text-[16px] text-stone-500">
            Latest news, articles, and insights
          </p>
        </div>

        @if (isLoading) {
        <div class="grid gap-[30px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
          <app-loading-skeleton type="post-card" />
          }
        </div>
        } @else {
        <div class="grid gap-[30px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          @for (item of posts; track item.post.id) {
          <article class="group bg-white transition-all hover:shadow-lg">
            @if (item.content.headerImg) {
            <div class="overflow-hidden">
              <a [routerLink]="['/blog/blog-details', item.post.id]">
                <img [src]="item.content.headerImg" 
                     class="w-full h-[240px] object-cover transition-all group-hover:scale-110" 
                     [alt]="item.content.title">
              </a>
            </div>
            }
            <div class="py-[25px] px-[25px] md:py-[30px] md:px-[30px]">
              <div class="flex items-center gap-[15px] mb-[15px]">
                <span class="text-[13px] md:text-[14px] text-stone-500">
                  <i class="ri-calendar-line"></i> {{ item.post.published | date:'MMM d, yyyy' }}
                </span>
                @if (item.post.author && item.post.author.displayName) {
                <span class="text-[13px] md:text-[14px] text-stone-500">
                  <i class="ri-user-line"></i> {{ item.post.author.displayName }}
                </span>
                }
              </div>
              <h2 class="text-[20px] md:text-[22px] lg:text-[24px] font-bold leading-[1.3] mb-[15px]">
                <a [routerLink]="['/blog/blog-details', item.post.id]" 
                   class="text-slate-900 transition-all hover:text-cyan-500"
                   [innerHTML]="item.content.title | safeHtml">
                </a>
              </h2>
              @if (item.content.lead) {
              <p class="text-[14px] md:text-[15px] text-stone-500 mb-[18px] line-clamp-3">
                {{ item.content.lead }}
              </p>
              }
              @if (item.post.labels && item.post.labels.length > 0) {
              <div class="flex flex-wrap gap-[8px] mb-[18px]">
                @for (label of item.post.labels.slice(0, 3); track label) {
                <span class="text-[12px] bg-amber-100 text-slate-900 px-[10px] py-[3px] rounded">
                  {{ label }}
                </span>
                }
              </div>
              }
              <a [routerLink]="['/blog/blog-details', item.post.id]" 
                 class="inline-block text-[14px] md:text-[15px] font-semibold text-slate-900 transition-all hover:text-cyan-500">
                Read More <i class="ri-arrow-right-line"></i>
              </a>
            </div>
          </article>
          }
        </div>
        }
      </div>
    </div>
    
    <app-ancal-footer />
  `
})
export default class BlogComponent implements OnInit {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private metaService = inject(MetaService);

  posts: Array<{ post: Post; content: IContent }> = [];
  isLoading = true;

  ngOnInit(): void {
    this.metaService.updateMetaTags({
      title: 'Blog - Street Surf Club',
      description: 'Latest news, articles, and insights from Street Surf Club',
      image: ''
    });

    this.bloggerService.getPosts().pipe(
      take(1),
      map(posts => {
        this.posts = posts
          .map(post => {
            const content = this.contentService.parseContent(post);
            return content ? { post, content } : null;
          })
          .filter((item): item is { post: Post; content: IContent } => item !== null);
        this.isLoading = false;
      })
    ).subscribe();
  }
}
