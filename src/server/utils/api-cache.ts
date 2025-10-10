/**
 * API Cache and Rate Limiting Utilities
 * 
 * Provides in-memory caching and retry mechanisms for Google Blogger API calls
 * to prevent rate limiting during prerendering and improve performance.
 */

import { fetchWithRetry } from './retry';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const apiCache = new ApiCache();

/**
 * Fetch with caching and retry logic
 */
async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  // Check cache first
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`[API Cache] Hit for ${url}`);
    return cached;
  }

  console.log(`[API Request] ${url}`);
  
  // Use existing retry mechanism
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }, maxRetries);

  const data = await response.json();
  
  // Cache successful responses
  apiCache.set(cacheKey, data);
  console.log(`[API Success] ${url}`);
  
  return data;
}

/**
 * Get Google Blogger API data with caching and retry logic
 */
export async function getBloggerApiData<T>(
  endpoint: string,
  apiKey: string,
  blogId: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!apiKey || !blogId) {
    throw new Error('Missing required environment variables: GOOGLE_BLOGGER_API_KEY or GOOGLE_BLOGGER_ID');
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    ...params,
  });

  const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}${endpoint}?${searchParams}`;

  return fetchWithCache<T>(url, {}, 3);
}

export { apiCache };