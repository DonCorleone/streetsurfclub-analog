import { ChangeDetectionStrategy, Component, HostListener, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { NgClass, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from "@angular/router";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { BloggerService } from "../../services/blogger.service";
import { DarkmodeService } from "../../services/darkmode.service";

@Component({
  selector: 'app-ancal-navbar',
  styleUrls: ['./ancal-navbar.component.css'],
  templateUrl: './ancal-navbar.component.html',
  imports: [NgClass, AsyncPipe, RouterLink, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AncalNavbarComponent {
  private bloggerService = inject(BloggerService);
  private darkmodeService = inject(DarkmodeService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Use resource directly - provides automatic loading state
  pagesResource = this.bloggerService.pagesResource;
  isDarkMode$ = this.darkmodeService.isDarkMode$;

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onStickyLogoClick(event: Event) {
    // Only run in browser, not during SSR/SSG
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // If we're on the home page, scroll to top instead of navigating
    if (this.router.url === '/') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Otherwise, let the routerLink handle navigation
  }

  // Navbar Sticky
  isSticky: boolean = false;

  @HostListener('window:scroll')
  checkScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= 200) {
      this.isSticky = true;
    } else {
      this.isSticky = false;
    }

  }
}
