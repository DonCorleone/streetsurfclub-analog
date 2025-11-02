import { ChangeDetectionStrategy, Component, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { NgClass, AsyncPipe } from '@angular/common';
import { RouterLink } from "@angular/router";
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

  // Use resource directly - provides automatic loading state
  pagesResource = this.bloggerService.pagesResource;
  isDarkMode$ = this.darkmodeService.isDarkMode$;

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Navbar Sticky
  isSticky: boolean = false;

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= 200) {
      this.isSticky = true;
    } else {
      this.isSticky = false;
    }

  }
}
