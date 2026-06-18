import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { RouterLink } from "@angular/router";
import { BloggerService } from "../../services/blogger.service";
import { NbButton, NbSeparator } from '@ng-brutalism/ui';

@Component({
  selector: 'app-ancal-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ancal-footer.component.html',
  imports: [SafeHtmlPipe, RouterLink, NbButton, NbSeparator]
})
export class AncalFooterComponent {
  private bloggerService = inject(BloggerService);

  quickLinks = this.bloggerService.quickLinks;
  resources = this.bloggerService.resources;
  terms = this.bloggerService.terms;
  supports = this.bloggerService.supports;

  readonly currentYear = new Date().getFullYear();
}
