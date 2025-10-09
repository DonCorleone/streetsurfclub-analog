import { Component, OnInit, inject } from '@angular/core';
import { BloggerService } from '../../services/blogger.service';
import { map, take } from 'rxjs';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ContentService } from '../../services/content.service';
import { IContent } from '../../models/IContent';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-banner',
  imports: [SafeHtmlPipe, LoadingSkeletonComponent],
  templateUrl: './ancal-banner.component.html'
})
export class AncalBannerComponent implements OnInit {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  parsedContent: IContent | null | undefined;
  isLoading = true;

  ngOnInit(): void {
    this.bloggerService.findPost('**Main**').pipe(
      take(1),
      map(post => {
        if (post) {
          this.parsedContent = this.contentService.parseContent(post);
        }
        this.isLoading = false;
      })
    ).subscribe();
  }

  // Video Popup
  isOpen = false;

  openPopup(): void {
    this.isOpen = true;
  }

  closePopup(): void {
    this.isOpen = false;
  }
}
