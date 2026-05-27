import { ChangeDetectionStrategy, Component, inject, effect, ErrorHandler } from '@angular/core';
import { BloggerService } from '../services/blogger.service';
import { MetaService } from '../services/meta.service';
import { Blog, mapBlogResponseToBlog } from '../interfaces/blog.interface';
import { AncalNavbarComponent } from '../components/ancal-navbar/ancal-navbar.component';
import { AncalBannerComponent } from '../components/ancal-banner/ancal-banner.component';
import { AncalBlogComponent } from '../components/ancal-blog/ancal-blog.component';
import { AncalFooterComponent } from '../components/ancal-footer/ancal-footer.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // Use the blog resource from the service
  blogResource = this.bloggerService.blogResource;

  constructor() {
    // Effect to update meta tags when blog data changes
    effect(() => {
      const blogResponse = this.blogResource.value();
      if (blogResponse) {
        try {
          const blog: Blog = mapBlogResponseToBlog(blogResponse);
          this.metaService.updateMetaForBlog(blog);
        } catch (error) {
          this.errorHandler.handleError(error);
        }
      }
    });
  }
}
