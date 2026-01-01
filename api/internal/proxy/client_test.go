package proxy

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"jonathanmcclement.com/playground/internal/storage"
)

// mockSpecStore implements storage.SpecStore for testing
type mockSpecStore struct {
	configs map[string]*storage.ServiceConfig
}

func (m *mockSpecStore) List() ([]string, error) {
	return nil, nil
}

func (m *mockSpecStore) Get(serviceName string) (json.RawMessage, error) {
	return nil, nil
}

func (m *mockSpecStore) GetConfig(serviceName string) (*storage.ServiceConfig, error) {
	config, exists := m.configs[serviceName]
	if !exists {
		return nil, storage.ErrServiceNotFound
	}
	return config, nil
}

func TestClient_Forward_BasicGET(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Errorf("expected GET request, got %s", r.Method)
		}
		if r.URL.Path != "/test" {
			t.Errorf("expected path /test, got %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message":"success"}`))
	}))
	defer backend.Close()

	// Create mock store
	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
			},
		},
	}

	client := NewClient(store)

	req := &Request{
		Service: "test-service",
		Method:  http.MethodGet,
		Path:    "/test",
	}

	resp, err := client.Forward(req)
	if err != nil {
		t.Fatalf("Forward() failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body, &body); err != nil {
		t.Fatalf("failed to unmarshal response body: %v", err)
	}

	if body["message"] != "success" {
		t.Errorf("expected message 'success', got %v", body["message"])
	}
}

func TestClient_Forward_POST_WithBody(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST request, got %s", r.Method)
		}

		// Verify Content-Type header
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}

		// Read and verify body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("failed to read request body: %v", err)
		}

		var payload map[string]interface{}
		if err := json.Unmarshal(body, &payload); err != nil {
			t.Fatalf("failed to unmarshal request body: %v", err)
		}

		if payload["name"] != "test" {
			t.Errorf("expected name 'test', got %v", payload["name"])
		}

		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":123}`))
	}))
	defer backend.Close()

	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
			},
		},
	}

	client := NewClient(store)

	reqBody := json.RawMessage(`{"name":"test"}`)
	req := &Request{
		Service: "test-service",
		Method:  http.MethodPost,
		Path:    "/items",
		Body:    reqBody,
	}

	resp, err := client.Forward(req)
	if err != nil {
		t.Fatalf("Forward() failed: %v", err)
	}

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201, got %d", resp.StatusCode)
	}
}

func TestClient_Forward_AuthHeaders(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify auth headers
		if r.Header.Get("Authorization") != "Bearer token123" {
			t.Errorf("expected Authorization 'Bearer token123', got %s", r.Header.Get("Authorization"))
		}
		if r.Header.Get("X-Api-Key") != "secret" {
			t.Errorf("expected X-Api-Key 'secret', got %s", r.Header.Get("X-Api-Key"))
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"authenticated":true}`))
	}))
	defer backend.Close()

	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"auth-service": {
				BaseURL: backend.URL,
				AuthHeaders: map[string]string{
					"Authorization": "Bearer token123",
					"X-Api-Key":     "secret",
				},
			},
		},
	}

	client := NewClient(store)

	req := &Request{
		Service: "auth-service",
		Method:  http.MethodGet,
		Path:    "/secure",
	}

	resp, err := client.Forward(req)
	if err != nil {
		t.Fatalf("Forward() failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}
}

func TestClient_Forward_HeaderOverride(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Request headers should override config headers
		if r.Header.Get("Authorization") != "Bearer override-token" {
			t.Errorf("expected Authorization 'Bearer override-token', got %s", r.Header.Get("Authorization"))
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer backend.Close()

	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
				AuthHeaders: map[string]string{
					"Authorization": "Bearer config-token",
				},
			},
		},
	}

	client := NewClient(store)

	req := &Request{
		Service: "test-service",
		Method:  http.MethodGet,
		Path:    "/test",
		Headers: map[string]string{
			"Authorization": "Bearer override-token",
		},
	}

	resp, err := client.Forward(req)
	if err != nil {
		t.Fatalf("Forward() failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}
}

func TestClient_Forward_ServiceNotFound(t *testing.T) {
	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{},
	}

	client := NewClient(store)

	req := &Request{
		Service: "nonexistent",
		Method:  http.MethodGet,
		Path:    "/test",
	}

	_, err := client.Forward(req)
	if err == nil {
		t.Fatal("expected error for nonexistent service, got nil")
	}
}

func TestClient_Forward_InvalidMethod(t *testing.T) {
	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: "http://example.com",
			},
		},
	}

	client := NewClient(store)

	req := &Request{
		Service: "test-service",
		Method:  "INVALID",
		Path:    "/test",
	}

	_, err := client.Forward(req)
	if err == nil {
		t.Fatal("expected error for invalid HTTP method, got nil")
	}
}

func TestClient_Forward_ResponseHeaders(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Custom-Header", "custom-value")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer backend.Close()

	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
			},
		},
	}

	client := NewClient(store)

	req := &Request{
		Service: "test-service",
		Method:  http.MethodGet,
		Path:    "/test",
	}

	resp, err := client.Forward(req)
	if err != nil {
		t.Fatalf("Forward() failed: %v", err)
	}

	contentType := resp.Headers["Content-Type"]
	if len(contentType) == 0 || contentType[0] != "application/json" {
		t.Errorf("expected Content-Type header 'application/json', got %v", contentType)
	}

	customHeader := resp.Headers["X-Custom-Header"]
	if len(customHeader) == 0 || customHeader[0] != "custom-value" {
		t.Errorf("expected X-Custom-Header 'custom-value', got %v", customHeader)
	}
}

func TestIsValidHTTPMethod(t *testing.T) {
	validMethods := []string{
		http.MethodGet,
		http.MethodPost,
		http.MethodPut,
		http.MethodPatch,
		http.MethodDelete,
		http.MethodHead,
		http.MethodOptions,
	}

	for _, method := range validMethods {
		if !isValidHTTPMethod(method) {
			t.Errorf("expected %s to be valid", method)
		}
	}

	invalidMethods := []string{"INVALID", "TRACE", "CONNECT", "get", ""}
	for _, method := range invalidMethods {
		if isValidHTTPMethod(method) {
			t.Errorf("expected %s to be invalid", method)
		}
	}
}
