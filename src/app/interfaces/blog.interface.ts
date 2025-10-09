import { BlogResponse as ModelBlogResponse, Locale } from '../models/blog';

export interface Blog {
  name: string;
  description: string;
  keywords?: string[];
  author?: string;
  image?: string;
  locale?: string;
  url?: string;
}

export const mapBlogResponseToBlog = (response: ModelBlogResponse): Blog => ({
  ...response,
  locale: response?.locale?.toString() || 'de_CH'
});
