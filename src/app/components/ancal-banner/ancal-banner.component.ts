import { ChangeDetectionStrategy, Component, inject, computed, resource } from '@angular/core';
import { BloggerService } from '../../services/blogger.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ContentService } from '../../services/content.service';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe, LoadingSkeletonComponent],
  templateUrl: './ancal-banner.component.html'
})
export class AncalBannerComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  mainPostResource = resource({
    loader: async () => {
      const posts = await this.bloggerService.getPostsByLabel('main');
      return posts.length > 0 ? posts[0] : null;
    }
  });

  parsedContent = computed(() => {
    const post = this.mainPostResource.value();
    return post ? this.contentService.parseContent(post) : null;
  });

  isLoading = computed(() => this.mainPostResource.isLoading());

  isOpen = false;

  openPopup(): void {
    this.isOpen = true;
  }

  closePopup(): void {
    this.isOpen = false;
  }
}
