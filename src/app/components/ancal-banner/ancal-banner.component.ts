import { ChangeDetectionStrategy, Component, inject, computed, resource } from '@angular/core';
import { BloggerService } from '../../services/blogger.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ContentService } from '../../services/content.service';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { RouterLink } from '@angular/router';
import { NbButton, NbChip, NbMarquee, NbMarqueeItem } from '@ng-brutalism/ui';

@Component({
  selector: 'app-ancal-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe, LoadingSkeletonComponent, RouterLink, NbButton, NbChip, NbMarquee, NbMarqueeItem],
  templateUrl: './ancal-banner.component.html'
})
export class AncalBannerComponent {
  readonly marqueeItems = [
    'STREET SURF CLUB', '✦', 'LUZERN', '✦', 'SURF', '✦', 'SKATE', '✦',
    'COMMUNITY', '✦', 'NEWS', '✦', 'EVENTS', '✦', 'LIFESTYLE', '✦',
  ];
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  // Resource for loading the main banner post
  mainPostResource = resource({
    loader: async () => {
      return await this.bloggerService.findPost('**Main**');
    }
  });

  // Computed parsed content
  parsedContent = computed(() => {
    const post = this.mainPostResource.value();
    return post ? this.contentService.parseContent(post) : null;
  });

  // Computed loading state
  isLoading = computed(() => this.mainPostResource.isLoading());

  // Video Popup
  isOpen = false;

  openPopup(): void {
    this.isOpen = true;
  }

  closePopup(): void {
    this.isOpen = false;
  }
}
