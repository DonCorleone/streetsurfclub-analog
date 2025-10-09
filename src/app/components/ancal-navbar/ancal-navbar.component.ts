import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from "@angular/router";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { Observable } from "rxjs";
import { Page } from "../../models/pages";
import { BloggerService } from "../../services/blogger.service";

@Component({
  selector: 'app-ancal-navbar',
  templateUrl: './ancal-navbar.component.html',
  imports: [NgClass, AsyncPipe, RouterLink, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AncalNavbarComponent {
  private bloggerService = inject(BloggerService);
  pages$: Observable<Page[]> = this.bloggerService.pages$;

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Navbar Sticky
  isSticky: boolean = false;

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= 50) {
      this.isSticky = true;
    } else {
      this.isSticky = false;
    }
  }
}
