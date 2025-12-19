import type { ApiClientConfig, ApiResponse, RequestOptions } from './apiClient';

// Lazy-loaded API client instance
let apiClientInstance: typeof import('./apiClient').default | null = null;

async function getApiClient() {
  if (!apiClientInstance) {
    const module = await import('./apiClient');
    apiClientInstance = module.default;
  }
  return apiClientInstance;
}

// Proxy methods that load the client on first use
export const api = {
  async get<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.get<T>(endpoint, options);
  },

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.post<T>(endpoint, data, options);
  },

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.put<T>(endpoint, data, options);
  },

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.patch<T>(endpoint, data, options);
  },

  async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.delete<T>(endpoint, options);
  },

  async upload<T>(
    endpoint: string,
    file: File,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.upload<T>(endpoint, file, options);
  },

  async getConfig(): Promise<ApiClientConfig> {
    const client = await getApiClient();
    return client.getConfig();
  },

  async healthCheck(): Promise<boolean> {
    const client = await getApiClient();
    return client.healthCheck();
  },
};

// Export types for consumers
export type { ApiClientConfig, ApiResponse, RequestOptions };
