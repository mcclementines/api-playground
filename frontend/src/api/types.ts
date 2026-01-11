import type { OpenAPISpecWithProxy } from '../types/openapi';
import type { ProxyRequest, ProxyResponse } from '../types/request';

// API client configuration
export interface ApiConfig {
  baseURL: string;
}

// API client interface
export interface ApiClient {
  getServices: () => Promise<string[]>;
  getSpec: (service: string) => Promise<OpenAPISpecWithProxy>;
  proxyRequest: <T = unknown>(request: ProxyRequest) => Promise<ProxyResponse<T>>;
}

// API error type
export class ApiError extends Error {
  statusCode?: number;
  response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}
