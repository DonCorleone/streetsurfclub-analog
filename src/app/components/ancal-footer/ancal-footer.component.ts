import { Component, inject } from '@angular/core';
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { RouterLink } from "@angular/router";
import { BloggerService } from "../../services/blogger.service";
import { DarkmodeService } from "../../services/darkmode.service";
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-ancal-footer',
  templateUrl: './ancal-footer.component.html',
  imports: [
    SafeHtmlPipe,
    RouterLink,
    AsyncPipe
  ]
})
export class AncalFooterComponent {
  private bloggerService = inject(BloggerService);
  private darkmodeService = inject(DarkmodeService);

  isDarkMode$ = this.darkmodeService.isDarkMode$;

  // Use computed signals for grouped pages
  quickLinks = this.bloggerService.quickLinks;
  resources = this.bloggerService.resources;
  terms = this.bloggerService.terms;
  supports = this.bloggerService.supports;
}
