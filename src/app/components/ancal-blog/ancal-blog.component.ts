import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloggerService } from '../../services/blogger.service';
import { ContentService } from '../../services/content.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { NetlifyImagePipe } from '../../pipes/netlify-image.pipe';
import { IContent } from '../../models/IContent';
import { DatePipe } from '@angular/common';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-blog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SafeHtmlPipe, NetlifyImagePipe, DatePipe, LoadingSkeletonComponent],
  templateUrl: './ancal-blog.component.html'
})
export class AncalBlogComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  // Use shared service resource — no duplicate HTTP call
  private postsResource = this.bloggerService.postsResource;

  // Computed signal that parses posts into content (limit to 3 posts)
  posts = computed(() => {
    const rawPosts = this.postsResource.value();
    if (!rawPosts) return [];

    return rawPosts
      .filter(post => !post.title.includes('**Main**')) // Filter out the **Main** post
      .slice(0, 3) // Take only first 3 posts (after filtering)
      .map(post => {
        const content = this.contentService.parseContent(post);
        return content ? { post, content } : null;
      })
      .filter((item): item is { post: any; content: IContent } => item !== null);
  });

  // Computed loading state
  isLoading = computed(() => this.postsResource.isLoading());
}
