import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloggerService } from '../../services/blogger.service';
import { ContentService } from '../../services/content.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { Post } from '../../models/posts';
import { IContent } from '../../models/IContent';
import { map, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-ancal-blog',
  imports: [RouterLink, SafeHtmlPipe, DatePipe, LoadingSkeletonComponent],
  templateUrl: './ancal-blog.component.html'
})
export class AncalBlogComponent implements OnInit {
  private bloggerService = inject(BloggerService);
  private contentService = inject(ContentService);

  posts: Array<{ post: Post; content: IContent }> = [];
  isLoading = true;

  ngOnInit(): void {
    this.bloggerService.getPosts(5).pipe(
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
