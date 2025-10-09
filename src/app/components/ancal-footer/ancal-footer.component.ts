import { Component, inject } from '@angular/core';
import { Page } from "../../models/pages";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { RouterLink } from "@angular/router";
import { BloggerService } from "../../services/blogger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-ancal-footer',
  templateUrl: './ancal-footer.component.html',
  imports: [
    SafeHtmlPipe,
    RouterLink
  ]
})
export class AncalFooterComponent {
  private bloggerService = inject(BloggerService);

  supports: Page[] = [];
  terms: Page[] = [];
  resources: Page[] = [];
  quickLinks: Page[] = [];

  constructor() {
    this.bloggerService.pages$.pipe(
      takeUntilDestroyed()
    ).subscribe(pages => {
      if (pages.length > 0) {
        this.quickLinks = this.bloggerService.quickLinks;
        this.resources = this.bloggerService.resources;
        this.terms = this.bloggerService.terms;
        this.supports = this.bloggerService.supports;
      }
    });
  }
}
