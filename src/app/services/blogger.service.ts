import { Injectable, inject, resource, computed } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from 'rxjs';
import { Page, PageResponse } from "../models/pages";
import { Post, PostResponse } from "../models/posts";
import { BlogResponse } from "../models/blog";
import { environment } from "../../environments/environment";


@Injectable({
  providedIn: 'root',
})
export class BloggerService {
  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiBaseUrl;

  // Resource for all pages - loads once on initialization
  pagesResource = resource({
    loader: () => this.loadPages()
  });

  // Resource for blog metadata
  blogResource = resource({
    loader: () => this.loadBlog()
  });

  // Resource for all posts - loads once on initialization
  postsResource = resource({
    loader: () => this.loadPosts()
  });

  // Computed signals for grouped pages
  quickLinks = computed(() => this.getPagesByGroup(this.pagesResource.value() ?? [], 'Quick Links'));
  resources = computed(() => this.getPagesByGroup(this.pagesResource.value() ?? [], 'Resources'));
  terms = computed(() => this.getPagesByGroup(this.pagesResource.value() ?? [], 'Terms'));
  supports = computed(() => this.getPagesByGroup(this.pagesResource.value() ?? [], 'Supports'));

  private postCache: { [id: string]: Post } = {};

  getPagesByGroup(pages: Page[], group: string): Page[] {
    // find pages where title contains attribute "group", the value should match the group parameter by regex
    // "title": "<div style=\"display: none;\" lead=\"\" sortorder=\"50\" group=\"Supports\"></div>Kontakt",
    return pages?.filter(page => page.title.match(new RegExp(`group="${group}"`, 'g'))) ?? [];
  }

  // Loader for pages resource
  private async loadPages(): Promise<Page[]> {
    try {
      const response = await firstValueFrom(
        this.httpClient.get<PageResponse>(`${this.apiBaseUrl}/list-pages`)
      );
      return response.items ? this.sortItems(response.items) : [];
    } catch (err) {
      console.error('Error loading pages:', err);
      return [];
    }
  }

  // Loader for blog resource
  private async loadBlog(): Promise<BlogResponse> {
    try {
      return await firstValueFrom(
        this.httpClient.get<BlogResponse>(`${this.apiBaseUrl}/get-blog`)
      );
    } catch (err) {
      console.error('Error loading blog:', err);
      return {} as BlogResponse;
    }
  }

  // Loader for posts resource
  private async loadPosts(): Promise<Post[]> {
    try {
      let params = new HttpParams();
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        params = params.set('mobile', 'true');
      }

      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/list-posts`, { params })
      );
      return response.items ?? [];
    } catch (err) {
      console.error('Error loading posts:', err);
      return [];
    }
  }

  // Async method for loading a single page (used in resources)
  async loadPage(pageid: string): Promise<Page | null> {
    try {
      return await firstValueFrom(
        this.httpClient.get<Page>(`${this.apiBaseUrl}/page/${pageid}`)
      );
    } catch (err) {
      console.error('Error loading page:', err);
      return null;
    }
  }

  // Async method for loading a single post (used in resources)
  async loadPost(postid: string): Promise<Post | null> {
    // Return cached post if available
    if (this.postCache[postid]) {
      return this.postCache[postid];
    }

    try {
      const post = await firstValueFrom(
        this.httpClient.get<Post>(`${this.apiBaseUrl}/post/${postid}`)
      );
      if (post) {
        this.postCache[postid] = post;
      }
      return post;
    } catch (err) {
      console.error('Error loading post:', err);
      return null;
    }
  }

  // Async method for fetching posts by label using the /posts list API
  async getPostsByLabel(labels: string): Promise<Post[]> {
    try {
      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/list-posts-by-label?labels=${encodeURIComponent(labels)}`)
      );
      return response.items ?? [];
    } catch (err) {
      console.error('Error fetching posts by label:', err);
      return [];
    }
  }

  // Dedicated method for the banner "main" post — uses a query-param-free endpoint
  // to avoid the Analog SSR interceptor's ofetch URLSearchParams spread bug.
  async getMainPost(): Promise<Post[]> {
    try {
      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/list-main-post`)
      );
      return response.items ?? [];
    } catch (err) {
      console.error('Error fetching main post:', err);
      return [];
    }
  }

  // Async method for finding a post by query (used in resources)
  async findPost(q: string): Promise<Post | null> {
    try {
      const encodedQ = encodeURIComponent(q);
      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/find-post?encodedQ=${encodedQ}`)
      );
      return response.items ? response.items[0] : null;
    } catch (err) {
      console.error('Error finding post:', err);
      return null;
    }
  }

  async searchPosts(q: string): Promise<Post[]> {
    try {
      const encodedQ = encodeURIComponent(q);
      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/find-post?encodedQ=${encodedQ}`)
      );
      return response.items ?? [];
    } catch (err) {
      console.error('Error searching posts:', err);
      return [];
    }
  }

  // Method for loading posts with custom maxResults (used in resources)
  async loadPostsWithLimit(maxResults?: number): Promise<Post[]> {
    try {
      let params = new HttpParams();
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        params = params.set('mobile', 'true');
      }
      if (maxResults) {
        params = params.set('maxResults', maxResults.toString());
      }

      const response = await firstValueFrom(
        this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/list-posts`, { params })
      );
      return response.items ?? [];
    } catch (err) {
      console.error('Error loading posts:', err);
      return [];
    }
  }

  private sortItems(items: Page[]): Page[] {
    return items.sort((a, b) => {
      const pattern = /sortorder="(\d+)"/;
      const matchA = pattern.exec(a.title);
      const matchB = pattern.exec(b.title);
      const sortOrderA = matchA ? parseInt(matchA[1], 10) : 0;
      const sortOrderB = matchB ? parseInt(matchB[1], 10) : 0;
      return sortOrderA - sortOrderB;
    });
  }
}
