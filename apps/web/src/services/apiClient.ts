import { apiConfig } from '../config/apiConfig';

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

class ApiClient {
  private config: ApiClientConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: Partial<ApiClientConfig> = {}) {
    // Use centralized API configuration
    const centralConfig = apiConfig.apiConfig;

    this.config = {
      baseUrl: centralConfig.baseUrl,
      timeout: centralConfig.timeout,
      retries: centralConfig.retries,
      ...config,
    };

    // Use headers from centralized config
    this.defaultHeaders = {
      ...centralConfig.headers,
    };

    // Validate configuration
    this.validateConfig();
  }

  private validateConfig(): void {
    try {
      new URL(this.config.baseUrl);
    } catch {
      throw new Error(`Invalid API base URL: ${this.config.baseUrl}`);
    }

    if (this.config.timeout <= 0) {
      throw new Error('API timeout must be greater than 0');
    }

    if (this.config.retries < 0) {
      throw new Error('API retries must be non-negative');
    }
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') {
      return {};
    }

    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get('content-type');
      let data: T | undefined;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = (await response.text()) as unknown as T;
      } else {
        // Handle binary data (blobs)
        data = (await response.blob()) as unknown as T;
      }

      if (!response.ok) {
        return {
          error: data
            ? (data as any).message || response.statusText
            : response.statusText,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: response.status,
      };
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeader(),
      ...options.headers,
    };

    let lastError: Error | null = null;
    const maxRetries = options.retries ?? this.config.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...options,
          headers,
        });

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort or 4xx errors
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      error: lastError?.message || 'Request failed',
      status: 0,
    };
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload
  async upload<T>(
    endpoint: string,
    file: File,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {
      ...this.getAuthHeader(),
      // Don't set Content-Type for FormData (browser sets it with boundary)
      ...((options.headers as Record<string, string>) || {}),
    };

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    });
  }

  // Get configuration info
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const apiClient = new ApiClient();

// Export types and instance
export type { ApiClientConfig, ApiResponse, RequestOptions };
export { ApiClient };
export default apiClient;
