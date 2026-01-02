// Proxy request types matching backend API

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ProxyRequest {
  service: string;
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse<T = any> {
  statusCode: number;
  headers: Record<string, string[]>;
  body: T;
}

// Request form state
export interface RequestFormState {
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: string; // JSON string
}

// Request history entry
export interface RequestHistoryEntry {
  id: string;
  timestamp: number;
  service: string;
  method: string;
  path: string;
  request: ProxyRequest;
  response: ProxyResponse;
  status: number; // Quick access to statusCode
}
