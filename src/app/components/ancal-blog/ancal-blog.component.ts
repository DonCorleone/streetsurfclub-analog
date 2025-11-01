import { Component, inject, computed, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloggerService } from '../../services/blogger.service';
import { DarkmodeService } from '../../services/darkmode.service';
import { ContentService } from '../../services/content.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { IContent } from '../../models/IContent';
import { AsyncPipe, DatePipe } from '@angular/common';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-blog',
  imports: [RouterLink, SafeHtmlPipe, DatePipe, LoadingSkeletonComponent, AsyncPipe],
  templateUrl: './ancal-blog.component.html'
})
export class AncalBlogComponent {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);
  private darkmodeService = inject(DarkmodeService);

  isDarkMode$ = this.darkmodeService.isDarkMode$;

  // Resource for loading limited posts (3 for homepage)
  postsResource = resource({
    loader: async () => {
      return await this.bloggerService.loadPostsWithLimit(3);
    }
  });

  // Computed signal that parses posts into content (limit to 3 posts)
  posts = computed(() => {
    const rawPosts = this.postsResource.value();
    if (!rawPosts) return [];

    return rawPosts
      .slice(0, 3) // Always take only first 3 posts
      .map(post => {
        const content = this.contentService.parseContent(post);
        return content ? { post, content } : null;
      })
      .filter((item): item is { post: any; content: IContent } => item !== null);
  });

  // Computed loading state
  isLoading = computed(() => this.postsResource.isLoading());
}
