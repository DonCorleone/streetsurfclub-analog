import { Component, inject, ErrorHandler } from '@angular/core';
import { BloggerService } from '../services/blogger.service';
import { MetaService } from '../services/meta.service';
import { Blog, mapBlogResponseToBlog } from '../interfaces/blog.interface';
import { BlogResponse } from '../models/blog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AncalNavbarComponent } from '../components/ancal-navbar/ancal-navbar.component';
import { AncalBannerComponent } from '../components/ancal-banner/ancal-banner.component';
import { AncalBlogComponent } from '../components/ancal-blog/ancal-blog.component';
import { AncalFooterComponent } from '../components/ancal-footer/ancal-footer.component';

@Component({
  selector: 'app-home',
  imports: [
    AncalNavbarComponent,
    AncalBannerComponent,
    AncalBlogComponent,
    AncalFooterComponent
  ],
  template: `
    <app-ancal-navbar />
    <app-ancal-banner />
    <app-ancal-blog id="blog" />
    <app-ancal-footer />
  `
})
export default class HomeComponent {
  private readonly bloggerService = inject(BloggerService);
  private readonly metaService = inject(MetaService);
  private readonly errorHandler = inject(ErrorHandler);

  constructor() {
    this.bloggerService.blog$
      .pipe(
        takeUntilDestroyed(),
        map((response: BlogResponse) => mapBlogResponseToBlog(response)),
        catchError(error => {
          this.errorHandler.handleError(error);
          return EMPTY;
        })
      )
      .subscribe((blog: Blog) => {
        try {
          this.metaService.updateMetaForBlog(blog);
        } catch (error) {
          this.errorHandler.handleError(error);
        }
      });
  }
}
