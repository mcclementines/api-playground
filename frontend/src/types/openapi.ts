import type { OpenAPIV3 } from 'openapi-types';

// Re-export OpenAPI types for convenience
export type OpenAPISpec = OpenAPIV3.Document;
export type PathItemObject = OpenAPIV3.PathItemObject;
export type OperationObject = OpenAPIV3.OperationObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type SchemaObject = OpenAPIV3.SchemaObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type ResponseObject = OpenAPIV3.ResponseObject;

// Custom type for proxy configuration in specs
export interface ProxyConfig {
  baseURL: string;
  authHeaders?: Record<string, string>;
}

// Extended OpenAPI spec with proxy config
export interface OpenAPISpecWithProxy extends OpenAPISpec {
  'x-proxy-config'?: ProxyConfig;
}

// Endpoint selection type
export interface EndpointSelection {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  operation: OperationObject;
}

// Parsed parameter categories
export interface ParsedParameters {
  pathParams: ParameterObject[];
  queryParams: ParameterObject[];
  headerParams: ParameterObject[];
}
