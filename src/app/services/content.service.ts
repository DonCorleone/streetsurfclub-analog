import { Injectable } from '@angular/core';
import { Page } from '../models/pages';
import { IContent } from '../models/IContent';
import { Post } from '../models/posts';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  parseContent(page: Page): IContent | null {
    if (!page) {
      return null;
    }

    let parsedContent: IContent = {
      author: '',
      date: new Date(),
      id: '',
      title: '',
      content: '',
      lead: '',
      headerImg: null,
      amountReplies: '0',
    };

    if (page.kind === 'blogger#post') {
      const images = (page as Post).images;
      parsedContent.headerImg =
        images && images.length > 0 ? images[0].url : null;
      parsedContent.amountReplies = (page as Post).replies?.totalItems;
    }
    if (page.content) {
      let decodedContent = decodeURIComponent(
        page.content.replace(/\\u/g, '%')
      );
      let regexImage =
        /(<div>\s*<div style="text-align: center;?"?>\s*<a href="[^"]*">\s*<img[^>]*><\/a>\s*<\/div>\s*<br \/><b><br \/><\/b>\s*<\/div>)/;
      let match = decodedContent.match(regexImage);

      if (!match) {
        regexImage = /<img[^>]*>/; // Regular expression to match the first <img> tag
        match = decodedContent.match(regexImage);
      }

      if (match) {
        let indexOfMatch = match.index;
        let imgBlock = match[0];
        if (
          imgBlock &&
          parsedContent.headerImg === null &&
          indexOfMatch !== undefined &&
          indexOfMatch < 10
        ) {
          let srcRegex = /<img[^>]+src="([^">]+)"/;
          let srcMatch = imgBlock.match(srcRegex);
          parsedContent.headerImg = srcMatch ? srcMatch[1] : null;
        }
      }

      // Replace the found image block in the content with an empty string, if headerimage is set and match is found
      if (parsedContent.headerImg && match) {
        decodedContent = decodedContent.replace(match[0], '');
      }

      let regexTwoImages = /<a[^>]*>(<img[^>]*>)<\/a>/gm;
      let matchTwoImages = decodedContent.match(regexTwoImages);
      let replacement = ``;
      let firstImage = '';
      if (matchTwoImages && matchTwoImages.length > 1) {
        replacement += `<div class="grid grid-cols-1 md:grid-cols-2 self-center gap-[25px] my-[20px] md:my-[25px] xl:my-[35px]">`;

        // pair of images found
        for (let i = 0; i < matchTwoImages.length; i++) {
          let imgBlock = matchTwoImages[i];
          if (firstImage === '') {
            firstImage = imgBlock;
          }
          let srcRegex = /<img[^>]+src="([^">]+)"/;
          let srcMatch = imgBlock.match(srcRegex);
          replacement += `
          <div class="text-center">
          <a href="${srcMatch ? srcMatch[1] : ''}" target="_blank">
              <img [src]="${
              srcMatch ? srcMatch[0] : ''
            }" class="rounded-t-[20px] rounded-bl-[20px] rounded-br-[20px] md:rounded-br-[70px] lg:rounded-br-[90px]" alt="blog-details-image"/>
          </a>
          </div>`;

          if (imgBlock !== firstImage) {
            decodedContent = decodedContent.replace(imgBlock, '');
          }
        }
        replacement += `
        </div>`;
      }
      decodedContent = decodedContent.replace(firstImage, replacement);
      parsedContent.content = decodedContent;
    }

    const leadRegex = /lead=\"(.*?)\"/;
    const matchLead = page.title.match(leadRegex);

    if (matchLead) {
      parsedContent.lead = matchLead[1];
    }

    parsedContent.title = page.title;
    parsedContent.id = page.id;
    parsedContent.date = new Date(page.published);
    parsedContent.author = page.author?.displayName;
    return parsedContent;
  }
}
