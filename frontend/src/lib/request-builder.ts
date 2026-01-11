import type { HttpMethod, ProxyRequest, RequestFormState } from '../types/request';

/**
 * Build a ProxyRequest from form state and endpoint details
 */
export function buildProxyRequest(
  service: string,
  method: HttpMethod,
  path: string,
  formState: RequestFormState
): ProxyRequest {
  // Replace path parameters in the path
  let finalPath = path;
  Object.entries(formState.pathParams).forEach(([key, value]) => {
    finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
  });

  // Build query string from query params
  const queryParams = new URLSearchParams();
  Object.entries(formState.queryParams).forEach(([key, value]) => {
    if (value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  if (queryString) {
    finalPath += `?${queryString}`;
  }

  // Build request object
  const request: ProxyRequest = {
    service,
    method,
    path: finalPath,
  };

  // Add headers if any
  const headers: Record<string, string> = {};
  Object.entries(formState.headers).forEach(([key, value]) => {
    if (key && value) {
      headers[key] = value;
    }
  });

  if (Object.keys(headers).length > 0) {
    request.headers = headers;
  }

  // Add body if present (for POST/PUT/PATCH)
  if (formState.body && formState.body.trim() !== '') {
    try {
      request.body = JSON.parse(formState.body);
    } catch {
      // If body is not valid JSON, include as string
      request.body = formState.body;
    }
  }

  return request;
}

/**
 * Extract path parameter names from a path template
 * Example: "/posts/{id}/comments/{commentId}" => ["id", "commentId"]
 */
export function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  return matches.map((match) => match.slice(1, -1));
}

/**
 * Validate that all required path params are filled
 */
export function validatePathParams(
  path: string,
  pathParams: Record<string, string>
): string | null {
  const required = extractPathParams(path);

  for (const param of required) {
    if (!pathParams[param] || pathParams[param].trim() === '') {
      return `Path parameter "${param}" is required`;
    }
  }

  return null;
}
