import { ChangeDetectionStrategy, Component, inject, computed, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloggerService } from '../../services/blogger.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ContentService } from '../../services/content.service';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe, LoadingSkeletonComponent, RouterLink],
  templateUrl: './ancal-banner.component.html'
})
export class AncalBannerComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  mainPostResource = resource({
    loader: async () => {
      return await this.bloggerService.findPost('**Main**');
    }
  });

  mainPost = computed(() => this.mainPostResource.value() ?? null);

  parsedContent = computed(() => {
    const post = this.mainPost();
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
