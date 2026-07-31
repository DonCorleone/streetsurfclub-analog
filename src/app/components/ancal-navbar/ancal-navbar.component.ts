import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from "@angular/router";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { BloggerService } from "../../services/blogger.service";

@Component({
  selector: 'app-ancal-navbar',
  styleUrls: ['./ancal-navbar.component.css'],
  templateUrl: './ancal-navbar.component.html',
  imports: [RouterLink, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AncalNavbarComponent {
  private bloggerService = inject(BloggerService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  pagesResource = this.bloggerService.pagesResource;

  onStickyLogoClick(event: Event) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.router.url === '/') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  submitNavSearch(value: string, input: HTMLInputElement): void {
    const q = value.trim();
    if (!q) return;
    input.value = '';
    input.blur();
    this.router.navigate(['/blog'], { queryParams: { q } });
  }
}
