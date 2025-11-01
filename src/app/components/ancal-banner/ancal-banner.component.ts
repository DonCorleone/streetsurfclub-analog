import { Component, inject, computed, resource } from '@angular/core';
import { BloggerService } from '../../services/blogger.service';
import { DarkmodeService } from '../../services/darkmode.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ContentService } from '../../services/content.service';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-ancal-banner',
  imports: [SafeHtmlPipe, LoadingSkeletonComponent, AsyncPipe],
  templateUrl: './ancal-banner.component.html'
})
export class AncalBannerComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private darkmodeService = inject(DarkmodeService);

  isDarkMode$ = this.darkmodeService.isDarkMode$;

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
