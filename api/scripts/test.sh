#!/bin/bash

# Test script for API Playground backend
# Usage: ./test.sh

set -e

BASE_URL="http://localhost:8080"

echo "========================================="
echo "API Playground Backend Test Suite"
echo "========================================="
echo ""

echo "=== 0. Testing CORS Headers ==="
echo "Checking CORS on /health endpoint..."
CORS_HEADERS=$(curl -s -I "$BASE_URL/health" | grep -i "access-control")
if [ -z "$CORS_HEADERS" ]; then
  echo "❌ CORS headers not found!"
  exit 1
else
  echo "✅ CORS headers present:"
  echo "$CORS_HEADERS"
fi
echo ""

echo "=== 0.1. Testing CORS Preflight (OPTIONS) ==="
curl -s -X OPTIONS "$BASE_URL/api/proxy" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -I | grep -i "access-control\|http"
echo ""

echo "=== 1. Testing Health Endpoint ==="
curl -s "$BASE_URL/health"
echo -e "\n"

echo "=== 2. Listing Available Services ==="
curl -s "$BASE_URL/api/specs" | jq '.'
echo ""

echo "=== 3. Getting JSONPlaceholder Spec ==="
curl -s "$BASE_URL/api/specs/jsonplaceholder" | jq '.info.title'
echo ""

echo "=== 4. Getting Dog API Spec ==="
curl -s "$BASE_URL/api/specs/dog-api" | jq '.info.title'
echo ""

echo "=== 5. Proxy: Get Post from JSONPlaceholder ==="
curl -s -X POST "$BASE_URL/api/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "jsonplaceholder",
    "method": "GET",
    "path": "/posts/1"
  }' | jq '{status: .statusCode, title: .body.title, userId: .body.userId}'
echo ""

echo "=== 6. Proxy: Create Post via JSONPlaceholder ==="
curl -s -X POST "$BASE_URL/api/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "jsonplaceholder",
    "method": "POST",
    "path": "/posts",
    "body": {
      "title": "Test Post from API Playground",
      "body": "This is a test post created via the proxy",
      "userId": 1
    }
  }' | jq '{status: .statusCode, id: .body.id, title: .body.title}'
echo ""

echo "=== 7. Proxy: Get Random Dog Image ==="
curl -s -X POST "$BASE_URL/api/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "dog-api",
    "method": "GET",
    "path": "/breeds/image/random"
  }' | jq '{status: .statusCode, imageUrl: .body.message, apiStatus: .body.status}'
echo ""

echo "=== 8. Proxy: Get Multiple Random Dog Images ==="
curl -s -X POST "$BASE_URL/api/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "dog-api",
    "method": "GET",
    "path": "/breeds/image/random/3"
  }' | jq '{status: .statusCode, imageCount: (.body.message | length)}'
echo ""

echo "=== 9. Proxy: List All Dog Breeds ==="
curl -s -X POST "$BASE_URL/api/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "dog-api",
    "method": "GET",
    "path": "/breeds/list/all"
  }' | jq '{status: .statusCode, breedCount: (.body.message | keys | length)}'
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="
