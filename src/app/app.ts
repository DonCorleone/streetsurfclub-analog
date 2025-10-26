import { Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class AppComponent {
  private platformId = inject(PLATFORM_ID);

  constructor() {
    // Only initialize AOS in the browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      import('aos').then((AOS) => {
        AOS.default.init({
          duration: 1000,
          once: true,
        });
      });
    }
  }
}
