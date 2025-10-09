/**
 * Retry a function with exponential backoff
 * Useful for handling rate limits and transient errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx except 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // If we've exhausted retries, throw
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Fetch with retry logic for rate limits
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 5
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error: any = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    
    return response;
  }, maxRetries);
}
