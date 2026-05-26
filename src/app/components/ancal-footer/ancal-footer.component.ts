import { Component, inject } from '@angular/core';
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { RouterLink } from "@angular/router";
import { BloggerService } from "../../services/blogger.service";

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

  // Use computed signals for grouped pages
  quickLinks = this.bloggerService.quickLinks;
  resources = this.bloggerService.resources;
  terms = this.bloggerService.terms;
  supports = this.bloggerService.supports;
}
