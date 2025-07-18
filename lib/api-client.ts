import { logger } from './logger';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

interface ApiError extends Error {
  status?: number;
  response?: Response;
  retryCount?: number;
}

class ApiClient {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      timeout: 30000,
      ...config
    };
  }

  /**
   * Make an API request with retry logic
   */
  async request<T = any>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        error.response = response;
        error.retryCount = retryCount;
        throw error;
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const apiError = error as ApiError;
      apiError.retryCount = retryCount;

      // Don't retry on client errors (4xx) except for rate limiting
      if (apiError.status && apiError.status >= 400 && apiError.status < 500 && apiError.status !== 429) {
        logger.error('Client error, not retrying', { 
          url, 
          status: apiError.status, 
          retryCount 
        });
        throw apiError;
      }

      // Don't retry on timeout or abort
      if (apiError.name === 'AbortError') {
        logger.error('Request timeout', { url, retryCount });
        throw apiError;
      }

      // Retry logic
      if (retryCount < this.config.maxRetries) {
        const delay = this.calculateDelay(retryCount);
        
        logger.warn('Request failed, retrying', { 
          url, 
          retryCount, 
          nextRetry: retryCount + 1,
          delay 
        });

        await this.sleep(delay);
        return this.request<T>(url, options, retryCount + 1);
      }

      logger.error('Request failed after all retries', { 
        url, 
        retryCount, 
        maxRetries: this.config.maxRetries 
      });
      throw apiError;
    }
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(retryCount: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retryCount);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let retryCount = 0;
      const maxRetries = this.config.maxRetries;

      const attemptUpload = () => {
        xhr.open('POST', url);
        
        // Set headers
        Object.entries(options.headers || {}).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });

        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress);
            }
          });
        }

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                data,
                status: xhr.status,
                headers: new Headers(),
              });
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`) as ApiError;
            error.status = xhr.status;
            reject(error);
          }
        };

        // Handle errors
        xhr.onerror = () => {
          const error = new Error('Network error') as ApiError;
          error.retryCount = retryCount;
          
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = this.calculateDelay(retryCount);
            
            logger.warn('File upload failed, retrying', { 
              url, 
              retryCount, 
              delay 
            });
            
            setTimeout(() => attemptUpload(), delay);
          } else {
            logger.error('File upload failed after all retries', { 
              url, 
              retryCount 
            });
            reject(error);
          }
        };

        // Handle timeout
        xhr.timeout = this.config.timeout;
        xhr.ontimeout = () => {
          const error = new Error('Upload timeout') as ApiError;
          error.retryCount = retryCount;
          
          if (retryCount < maxRetries) {
            retryCount++;
            const delay = this.calculateDelay(retryCount);
            
            logger.warn('File upload timeout, retrying', { 
              url, 
              retryCount, 
              delay 
            });
            
            setTimeout(() => attemptUpload(), delay);
          } else {
            logger.error('File upload timeout after all retries', { 
              url, 
              retryCount 
            });
            reject(error);
          }
        };

        // Send the file
        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      };

      attemptUpload();
    });
  }

  /**
   * Batch multiple requests
   */
  async batch<T = any>(
    requests: Array<{ url: string; options?: RequestInit }>,
    concurrency = 5
  ): Promise<Array<ApiResponse<T> | ApiError>> {
    const results: Array<ApiResponse<T> | ApiError> = [];
    const chunks = this.chunk(requests, concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(({ url, options }) =>
        this.request<T>(url, options).catch(error => error as ApiError)
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Split array into chunks
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export { ApiClient };
export type { RetryConfig, ApiResponse, ApiError }; 