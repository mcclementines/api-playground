package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"jonathanmcclement.com/playground/internal/proxy"
	"jonathanmcclement.com/playground/internal/storage"
)

// setupTestServer creates a test server with test specs
func setupTestServer(t *testing.T) (*Server, string) {
	t.Helper()

	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))

	// Create temp directory with test specs
	tempDir := t.TempDir()
	specDir := filepath.Join(tempDir, "specs")
	if err := os.Mkdir(specDir, 0755); err != nil {
		t.Fatalf("failed to create spec dir: %v", err)
	}

	// Create test spec with proxy config
	testSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"x-proxy-config": map[string]interface{}{
			"baseURL": "http://example.com",
		},
		"info": map[string]interface{}{
			"title":   "Test API",
			"version": "1.0.0",
		},
	}
	specData, _ := json.Marshal(testSpec)
	specPath := filepath.Join(specDir, "test-service.json")
	if err := os.WriteFile(specPath, specData, 0644); err != nil {
		t.Fatalf("failed to write test spec: %v", err)
	}

	// Initialize store
	specStore, err := storage.NewFileSpecStore(specDir)
	if err != nil {
		t.Fatalf("failed to create spec store: %v", err)
	}

	// Initialize proxy client
	proxyClient := proxy.NewClient(specStore)

	server := &Server{
		logger:      logger,
		specStore:   specStore,
		proxyClient: proxyClient,
	}

	return server, tempDir
}

func TestServer_Health(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}

	expected := "ok"
	if string(body) != expected {
		t.Errorf("expected body %q, got %q", expected, string(body))
	}
}

func TestServer_SpecsList(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/specs")
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var services []string
	if err := json.NewDecoder(resp.Body).Decode(&services); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(services) != 1 {
		t.Fatalf("expected 1 service, got %d", len(services))
	}

	if services[0] != "test-service" {
		t.Errorf("expected service 'test-service', got %q", services[0])
	}
}

func TestServer_SpecsGet(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/specs/test-service")
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var spec map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&spec); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if spec["openapi"] != "3.0.0" {
		t.Errorf("expected openapi 3.0.0, got %v", spec["openapi"])
	}

	info, ok := spec["info"].(map[string]interface{})
	if !ok {
		t.Fatal("expected info object")
	}

	if info["title"] != "Test API" {
		t.Errorf("expected title 'Test API', got %v", info["title"])
	}
}

func TestServer_SpecsGet_NotFound(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/specs/nonexistent")
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, resp.StatusCode)
	}
}

func TestServer_Proxy(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message":"backend response"}`))
	}))
	defer backend.Close()

	// Set up server with backend URL
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	tempDir := t.TempDir()
	specDir := filepath.Join(tempDir, "specs")
	os.Mkdir(specDir, 0755)

	// Create spec with backend URL
	testSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"x-proxy-config": map[string]interface{}{
			"baseURL": backend.URL,
		},
		"info": map[string]interface{}{
			"title": "Test API",
		},
	}
	specData, _ := json.Marshal(testSpec)
	os.WriteFile(filepath.Join(specDir, "test-service.json"), specData, 0644)

	specStore, _ := storage.NewFileSpecStore(specDir)
	proxyClient := proxy.NewClient(specStore)

	server := &Server{
		logger:      logger,
		specStore:   specStore,
		proxyClient: proxyClient,
	}

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	// Make proxy request
	reqBody := map[string]interface{}{
		"service": "test-service",
		"method":  "GET",
		"path":    "/test",
	}
	reqJSON, _ := json.Marshal(reqBody)

	resp, err := http.Post(ts.URL+"/api/proxy", "application/json", bytes.NewReader(reqJSON))
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var proxyResp proxy.Response
	if err := json.NewDecoder(resp.Body).Decode(&proxyResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if proxyResp.StatusCode != http.StatusOK {
		t.Errorf("expected backend status %d, got %d", http.StatusOK, proxyResp.StatusCode)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(proxyResp.Body, &body); err != nil {
		t.Fatalf("failed to unmarshal backend response: %v", err)
	}

	if body["message"] != "backend response" {
		t.Errorf("expected message 'backend response', got %v", body["message"])
	}
}

func TestServer_Proxy_InvalidJSON(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Post(ts.URL+"/api/proxy", "application/json", strings.NewReader("{invalid json}"))
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestServer_CORS_Headers(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Check CORS headers are present
	if resp.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("expected Access-Control-Allow-Origin '*', got %q", resp.Header.Get("Access-Control-Allow-Origin"))
	}

	if resp.Header.Get("Access-Control-Allow-Methods") == "" {
		t.Error("expected Access-Control-Allow-Methods header to be set")
	}

	if resp.Header.Get("Access-Control-Allow-Headers") == "" {
		t.Error("expected Access-Control-Allow-Headers header to be set")
	}
}

func TestServer_CORS_Preflight(t *testing.T) {
	server, _ := setupTestServer(t)

	ts := httptest.NewServer(server.routes())
	defer ts.Close()

	// Create OPTIONS request (preflight)
	req, err := http.NewRequest(http.MethodOptions, ts.URL+"/api/proxy", nil)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	// Preflight should return 204 No Content
	if resp.StatusCode != http.StatusNoContent {
		t.Errorf("expected status %d, got %d", http.StatusNoContent, resp.StatusCode)
	}

	// Check CORS headers
	if resp.Header.Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("expected Access-Control-Allow-Origin '*', got %q", resp.Header.Get("Access-Control-Allow-Origin"))
	}

	allowMethods := resp.Header.Get("Access-Control-Allow-Methods")
	if !strings.Contains(allowMethods, "POST") {
		t.Errorf("expected Access-Control-Allow-Methods to contain 'POST', got %q", allowMethods)
	}

	allowHeaders := resp.Header.Get("Access-Control-Allow-Headers")
	if !strings.Contains(allowHeaders, "Content-Type") {
		t.Errorf("expected Access-Control-Allow-Headers to contain 'Content-Type', got %q", allowHeaders)
	}

	// Check max age
	if resp.Header.Get("Access-Control-Max-Age") != "86400" {
		t.Errorf("expected Access-Control-Max-Age '86400', got %q", resp.Header.Get("Access-Control-Max-Age"))
	}
}
