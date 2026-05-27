import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  constructor() {
    // Only initialize AOS in the browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      import('aos').then((AOS) => {
        AOS.default.init({
          duration: 1000,
          once: true,
        });
      });

      // Scroll to top on route navigation
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
  }
}
