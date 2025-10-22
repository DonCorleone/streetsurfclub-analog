import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import {BehaviorSubject, Observable, catchError, map, of} from 'rxjs';
import {Page, PageResponse} from "../models/pages";
import {Post, PostResponse} from "../models/posts";
import {BlogResponse} from "../models/blog";
import {environment} from "../../environments/environment";


@Injectable({
  providedIn: 'root',
})
export class BloggerService {
  private httpClient = inject(HttpClient);

  private apiBaseUrl = environment.apiBaseUrl;

  quickLinks: Page[] = [];
  resources: Page[] = [];
  terms: Page[] = [];
  supports: Page[] = [];

  private blogSubject = new BehaviorSubject<BlogResponse>({} as BlogResponse);
  public blog$ = this.blogSubject.asObservable();

  private pagesSubject = new BehaviorSubject<Page[]>([]);
  public pages$ = this.pagesSubject.asObservable();

  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  private postsCache: { [maxResults: string]: Post[] } = {};
  private postCache: { [id: string]: Post } = {};

  constructor() {
    this.getPagesByMode().subscribe(pages => {

      this.quickLinks = this.getPagesByGroup(pages,'Quick Links');
      this.resources = this.getPagesByGroup(pages,'Resources');
      this.terms = this.getPagesByGroup(pages, 'Terms');
      this.supports = this.getPagesByGroup(pages,'Supports');

      this.pagesSubject.next(pages);
    });

    this.getBlog().subscribe(blog => {
      this.blogSubject.next(blog ?? {} as BlogResponse);
    });

    // Pre-fetch posts for caching
    this.getPosts().subscribe(posts => {
      this.postsSubject.next(posts);
    });
  }

  getPagesByGroup(pages: Page[], group: string): Page[]  {

    // find pages where title contains attribute "group", the value should match the group parameter by regex
    // "title": "<div style=\"display: none;\" lead=\"\" sortorder=\"50\" group=\"Supports\"></div>Kontakt",
    return pages?.filter(page => page.title.match(new RegExp(`group="${group}"`, 'g'))) ?? [];
  }

  private getPagesByMode(): Observable<Page[]> {
    console.log('Production Mode');
    return this.httpClient.get<PageResponse>(`${this.apiBaseUrl}/list-pages`).pipe(
      map(response => response.items ? this.sortItems(response.items) : []),
      catchError(err => {
        console.error(err);
        return of([]);
      }));
  }

  private getBlog(): Observable<BlogResponse | null> {
    return this.httpClient.get<BlogResponse>(`${this.apiBaseUrl}/get-blog`).pipe(
      catchError(err => {
        console.error('Error fetching blog:', err);
        return of({} as BlogResponse);
      })
    );
  }

  getPage(pageid: string): Observable<Page | null> {
    // NOTE: During SSR/prerendering, HttpParams don't work with internal h3 routes
    // We must construct the query string manually in the URL
    const url = `${this.apiBaseUrl}/get-page?pageid=${encodeURIComponent(pageid)}`;
    return this.httpClient.get<Page>(url).pipe(
      catchError(err => {
        console.error('Error fetching page:', err);
        return of(null);
      })
    );
  }

  // Path-based API call (works with SSR - use this for SSR-safe page fetching)
  getPageByPath(pageid: string): Observable<Page | null> {
    return this.httpClient.get<Page>(`${this.apiBaseUrl}/page/${pageid}`).pipe(
      catchError(err => {
        console.error('Error fetching page by path:', err);
        return of(null);
      })
    );
  }

  getPost(postid: string): Observable<Post | null> {
    // Return cached post if available
    if (this.postCache[postid]) {
      return of(this.postCache[postid]);
    }

    const params = new HttpParams().set('postid', postid);
    return this.httpClient.get<Post>(`${this.apiBaseUrl}/get-post`, { params }).pipe(
      map(post => {
        if (post) {
          this.postCache[postid] = post;
        }
        return post;
      }),
      catchError(err => {
        console.error('Error fetching post:', err);
        return of(null);
      })
    );
  }

  // Path-based API call (works with SSR - use this for SSR-safe post fetching)
  getPostByPath(postid: string): Observable<Post | null> {
    // Return cached post if available
    if (this.postCache[postid]) {
      return of(this.postCache[postid]);
    }

    return this.httpClient.get<Post>(`${this.apiBaseUrl}/post/${postid}`).pipe(
      map(post => {
        if (post) {
          this.postCache[postid] = post;
        }
        return post;
      }),
      catchError(err => {
        console.error('Error fetching post by path:', err);
        return of(null);
      })
    );
  }

  findPost(q: string): Observable<Post | null> {
    console.log('Production Mode');
    const encodedQ = encodeURIComponent(q);
    return this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/find-post?encodedQ=${encodedQ}`).pipe(
      map(response => response.items ?  response.items[0] : null),
      catchError(err => {
        console.error(err);
        return of(null);
      }));
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

  getPosts(maxResults?: number): Observable<Post[]> {
    const cacheKey = maxResults?.toString() ?? 'all';
    
    // Return cached posts if available
    if (this.postsCache[cacheKey]) {
      return of(this.postsCache[cacheKey]);
    }

    // evaluate if running on a mobile device
    // add a query parameter declaring if running on a mobile device
    let params = new HttpParams();
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      params = params.set('mobile', 'true');
    }
    if (maxResults) {
      params = params.set('maxResults', maxResults.toString());
    }

    return this.httpClient.get<PostResponse>(`${this.apiBaseUrl}/list-posts`, { params }).pipe(
      map(response => {
        const posts = response.items ?? [];
        this.postsCache[cacheKey] = posts;
        if (!maxResults) {
          this.postsSubject.next(posts);
        }
        return posts;
      }),
      catchError(err => {
        console.error('Error fetching posts:', err);
        return of([]);
      })
    );
  }
}
