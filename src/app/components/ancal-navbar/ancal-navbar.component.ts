import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from "@angular/router";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { BloggerService } from "../../services/blogger.service";
import { NbButton } from '@ng-brutalism/ui';

@Component({
  selector: 'app-ancal-navbar',
  styleUrls: ['./ancal-navbar.component.css'],
  templateUrl: './ancal-navbar.component.html',
  imports: [RouterLink, SafeHtmlPipe, NbButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'checkScroll()',
  },
})
export class AncalNavbarComponent {
  private bloggerService = inject(BloggerService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  pagesResource = this.bloggerService.pagesResource;

  menuOpen = false;
  isSticky = signal(false);

  navbarClasses = computed(() =>
    this.isSticky()
      ? 'isSticky lg:fixed lg:top-0'
      : 'lg:relative lg:top-auto'
  );

  spacerClasses = computed(() =>
    this.isSticky() ? 'lg:h-28' : 'lg:h-0'
  );

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onStickyLogoClick(event: Event) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.router.url === '/') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  checkScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isSticky.set(scrollPosition >= 200);
  }
}
