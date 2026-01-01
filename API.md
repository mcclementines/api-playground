# API Playground Backend - API Documentation

## Overview

The API Playground Backend is a REST API that allows you to explore and test various third-party APIs through a unified proxy interface. It serves OpenAPI specifications and proxies requests to configured backend services.

**Base URL:** `http://localhost:8080`

**CORS:** ✅ Enabled for all origins - no CORS configuration needed in your frontend!

---

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

---

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```
ok
```

**Example:**
```javascript
const response = await fetch('http://localhost:8080/health');
const status = await response.text();
console.log(status); // "ok"
```

---

### 2. List Available Services

Get a list of all available API services you can interact with.

**Endpoint:** `GET /api/specs`

**Response:** `200 OK`
```json
[
  "dog-api",
  "jsonplaceholder"
]
```

**Example:**
```javascript
const response = await fetch('http://localhost:8080/api/specs');
const services = await response.json();
console.log(services); // ["dog-api", "jsonplaceholder"]
```

---

### 3. Get Service OpenAPI Specification

Retrieve the complete OpenAPI specification for a specific service. Use this to dynamically build your UI based on available endpoints.

**Endpoint:** `GET /api/specs/{service}`

**Path Parameters:**
- `service` (string, required): The service name (from the list endpoint)

**Response:** `200 OK`
```json
{
  "openapi": "3.0.0",
  "x-proxy-config": {
    "baseURL": "https://jsonplaceholder.typicode.com"
  },
  "info": {
    "title": "JSONPlaceholder API",
    "version": "1.0.0",
    "description": "Fake REST API for testing and prototyping"
  },
  "servers": [
    {
      "url": "https://jsonplaceholder.typicode.com"
    }
  ],
  "paths": {
    "/posts": {
      "get": {
        "summary": "Get all posts",
        "responses": { ... }
      },
      "post": {
        "summary": "Create a post",
        "requestBody": { ... }
      }
    }
  }
}
```

**Error Response:** `404 Not Found`
```json
spec not found
```

**Example:**
```javascript
const service = 'jsonplaceholder';
const response = await fetch(`http://localhost:8080/api/specs/${service}`);
const spec = await response.json();

// Access spec info
console.log(spec.info.title); // "JSONPlaceholder API"
console.log(spec.paths);      // All available endpoints
```

---

### 4. Proxy Request

Send a request to a backend API service through the proxy. The proxy adds authentication headers and bypasses CORS restrictions.

**Endpoint:** `POST /api/proxy`

**Request Body:**
```typescript
{
  service: string;      // Service name (e.g., "jsonplaceholder")
  method: string;       // HTTP method: GET, POST, PUT, PATCH, DELETE
  path: string;         // API path (e.g., "/posts/1")
  headers?: object;     // Optional headers (will override service defaults)
  body?: any;           // Optional request body (for POST, PUT, PATCH)
}
```

**Response:** `200 OK`
```typescript
{
  statusCode: number;           // Backend response status (200, 404, etc.)
  headers: Record<string, string[]>;  // Backend response headers
  body: any;                    // Backend response body (parsed JSON)
}
```

**Error Responses:**
- `400 Bad Request` - Invalid JSON in request body
- `502 Bad Gateway` - Service not found or proxy request failed

---

## Usage Examples

### Example 1: Get a Post from JSONPlaceholder

```javascript
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'jsonplaceholder',
    method: 'GET',
    path: '/posts/1'
  })
});

const result = await response.json();

console.log(result.statusCode); // 200
console.log(result.body);
// {
//   "userId": 1,
//   "id": 1,
//   "title": "...",
//   "body": "..."
// }
```

### Example 2: Create a Post via JSONPlaceholder

```javascript
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'jsonplaceholder',
    method: 'POST',
    path: '/posts',
    body: {
      title: 'My New Post',
      body: 'This is the content',
      userId: 1
    }
  })
});

const result = await response.json();

console.log(result.statusCode); // 201
console.log(result.body.id);    // 101 (new post ID)
```

### Example 3: Get Random Dog Image

```javascript
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'dog-api',
    method: 'GET',
    path: '/breeds/image/random'
  })
});

const result = await response.json();

console.log(result.body.message);
// "https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg"
console.log(result.body.status);
// "success"
```

### Example 4: Get Multiple Random Dog Images

```javascript
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'dog-api',
    method: 'GET',
    path: '/breeds/image/random/3'
  })
});

const result = await response.json();

console.log(result.body.message);
// ["https://...", "https://...", "https://..."]
```

### Example 5: Custom Headers

```javascript
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service: 'jsonplaceholder',
    method: 'GET',
    path: '/posts/1',
    headers: {
      'Accept': 'application/json',
      'X-Custom-Header': 'my-value'
    }
  })
});
```

---

## React/TypeScript Example

### Type Definitions

```typescript
interface ProxyRequest {
  service: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ProxyResponse<T = any> {
  statusCode: number;
  headers: Record<string, string[]>;
  body: T;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  [key: string]: any;
}
```

### React Hook

```typescript
import { useState } from 'react';

const API_BASE = 'http://localhost:8080';

export function useApiProxy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proxyRequest = async <T = any>(
    request: ProxyRequest
  ): Promise<ProxyResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as ProxyResponse<T>;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getServices = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE}/api/specs`);
    return response.json();
  };

  const getSpec = async (service: string): Promise<OpenAPISpec | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/specs/${service}`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  };

  return { proxyRequest, getServices, getSpec, loading, error };
}
```

### Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { useApiProxy } from './hooks/useApiProxy';

export function DogImageDisplay() {
  const { proxyRequest, loading, error } = useApiProxy();
  const [imageUrl, setImageUrl] = useState<string>('');

  const fetchDogImage = async () => {
    const result = await proxyRequest<{ message: string; status: string }>({
      service: 'dog-api',
      method: 'GET',
      path: '/breeds/image/random',
    });

    if (result && result.statusCode === 200) {
      setImageUrl(result.body.message);
    }
  };

  useEffect(() => {
    fetchDogImage();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <img src={imageUrl} alt="Random dog" style={{ maxWidth: '400px' }} />
      <button onClick={fetchDogImage}>Get New Dog</button>
    </div>
  );
}
```

---

## Available Services

### JSONPlaceholder API

**Service Name:** `jsonplaceholder`

**Base URL:** `https://jsonplaceholder.typicode.com`

**Description:** Fake REST API for testing and prototyping

**Key Endpoints:**
- `GET /posts` - List all posts
- `GET /posts/{id}` - Get a specific post
- `POST /posts` - Create a new post
- `PUT /posts/{id}` - Update a post
- `DELETE /posts/{id}` - Delete a post

### Dog CEO API

**Service Name:** `dog-api`

**Base URL:** `https://dog.ceo/api`

**Description:** Public API for random dog images

**Key Endpoints:**
- `GET /breeds/image/random` - Get random dog image
- `GET /breeds/image/random/{count}` - Get multiple random images (1-50)
- `GET /breeds/list/all` - List all dog breeds

---

## Error Handling

### Client-Side Errors (4xx)

**400 Bad Request:**
```javascript
// Invalid JSON in request body
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  body: 'invalid json'
});
// Response: 400, body: "invalid request body"
```

**404 Not Found:**
```javascript
// Service doesn't exist
const response = await fetch('http://localhost:8080/api/specs/nonexistent');
// Response: 404, body: "spec not found"
```

### Server-Side Errors (5xx)

**502 Bad Gateway:**
```javascript
// Service exists but proxy request failed
const response = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'nonexistent',
    method: 'GET',
    path: '/test'
  })
});
// Response: 502, body: "proxy request failed"
```

### Handling Backend Errors

The proxy returns the backend's status code in the response body:

```javascript
const result = await fetch('http://localhost:8080/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'jsonplaceholder',
    method: 'GET',
    path: '/posts/999999'
  })
});

const data = await result.json();

if (data.statusCode === 404) {
  console.log('Post not found on backend');
}
```

---

## CORS

**All CORS headers are automatically set.** No configuration needed!

**Allowed:**
- Origins: `*` (all)
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization`

**Preflight requests (OPTIONS) are handled automatically.**

---

## Best Practices

### 1. Always Check Status Codes

```javascript
const result = await proxyRequest({ ... });

if (result.statusCode >= 200 && result.statusCode < 300) {
  // Success
  console.log(result.body);
} else {
  // Handle error
  console.error(`Backend returned ${result.statusCode}`);
}
```

### 2. Use TypeScript for Type Safety

```typescript
interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const result = await proxyRequest<Post>({
  service: 'jsonplaceholder',
  method: 'GET',
  path: '/posts/1'
});

if (result && result.statusCode === 200) {
  const post: Post = result.body; // Type-safe!
}
```

### 3. Handle Loading and Error States

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await proxyRequest({ ... });
    if (result.statusCode === 200) {
      setData(result.body);
    } else {
      setError(`Error: ${result.statusCode}`);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 4. Cache OpenAPI Specs

```typescript
const specsCache = new Map<string, OpenAPISpec>();

async function getSpec(service: string): Promise<OpenAPISpec> {
  if (specsCache.has(service)) {
    return specsCache.get(service)!;
  }

  const response = await fetch(`http://localhost:8080/api/specs/${service}`);
  const spec = await response.json();
  specsCache.set(service, spec);

  return spec;
}
```

---

## Rate Limiting

Currently, there are **no rate limits**. Use responsibly!

---

## Support

For issues or questions, please contact the backend team or check the source code at your repository.

---

## Changelog

### v1.0.0 (Current)
- ✅ Health check endpoint
- ✅ List services endpoint
- ✅ Get service spec endpoint
- ✅ Proxy endpoint with full HTTP method support
- ✅ CORS enabled for all origins
- ✅ JSONPlaceholder and Dog CEO API support
