import type { OpenAPISpec } from '../types/openapi';
import type { ProxyRequest, ProxyResponse } from '../types/request';
import { ApiError, type ApiClient, type ApiConfig } from './types';

const DEFAULT_CONFIG: ApiConfig = {
  baseURL: 'http://localhost:8080',
};

class ApiClientImpl implements ApiClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch all available services
   * GET /api/specs
   */
  async getServices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/specs`);

      if (!response.ok) {
        throw new ApiError(
          `Failed to fetch services: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch services'
      );
    }
  }

  /**
   * Fetch OpenAPI specification for a service
   * GET /api/specs/{service}
   */
  async getSpec(service: string): Promise<OpenAPISpec> {
    try {
      const response = await fetch(
        `${this.config.baseURL}/api/specs/${encodeURIComponent(service)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(`Service "${service}" not found`, 404);
        }
        throw new ApiError(
          `Failed to fetch spec: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch spec'
      );
    }
  }

  /**
   * Send a proxy request to a backend service
   * POST /api/proxy
   */
  async proxyRequest<T = any>(request: ProxyRequest): Promise<ProxyResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          `Proxy request failed: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      const data: ProxyResponse<T> = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Proxy request failed'
      );
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClientImpl();

// Export class for testing
export { ApiClientImpl };
