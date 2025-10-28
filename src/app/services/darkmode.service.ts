import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkmodeService {
  private isDarkModeSubject: ReplaySubject<boolean>;
  private bufferSize: number = 1;
  private platformId = inject(PLATFORM_ID);

  isDarkMode$;

  constructor() {
    this.isDarkModeSubject = new ReplaySubject<boolean>(this.bufferSize);
    this.isDarkMode$ = this.isDarkModeSubject.asObservable();

    // Only access window in the browser
    if (isPlatformBrowser(this.platformId)) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkModeSubject.next(darkModeQuery.matches);

      darkModeQuery.addEventListener('change', event => {
        this.isDarkModeSubject.next(event.matches);
      });
    } else {
      // Default to light mode during SSR
      this.isDarkModeSubject.next(false);
    }
  }
}
