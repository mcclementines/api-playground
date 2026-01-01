package handlers_test

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"jonathanmcclement.com/playground/internal/handlers"
	"jonathanmcclement.com/playground/internal/proxy"
	"jonathanmcclement.com/playground/internal/storage"
)

func TestProxyHandler_Handle_Success(t *testing.T) {
	// Create mock backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message":"success"}`))
	}))
	defer backend.Close()

	// Create mock store
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{
			"test-service": json.RawMessage(`{"openapi":"3.0.0"}`),
		},
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
			},
		},
	}

	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	proxyClient := proxy.NewClient(store)
	handler := handlers.NewProxyHandler(logger, proxyClient)

	reqBody := `{"service":"test-service","method":"GET","path":"/test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(reqBody))
	rec := httptest.NewRecorder()

	handler.Handle(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	var resp proxy.Response
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected backend status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body, &body); err != nil {
		t.Fatalf("failed to unmarshal backend response: %v", err)
	}

	if body["message"] != "success" {
		t.Errorf("expected message 'success', got %v", body["message"])
	}
}

func TestProxyHandler_Handle_InvalidJSON(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	proxyClient := proxy.NewClient(&mockSpecStore{})
	handler := handlers.NewProxyHandler(logger, proxyClient)

	req := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader("{invalid json}"))
	rec := httptest.NewRecorder()

	handler.Handle(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

func TestProxyHandler_Handle_ServiceNotFound(t *testing.T) {
	store := &mockSpecStore{
		specs:   map[string]json.RawMessage{},
		configs: map[string]*storage.ServiceConfig{},
	}

	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	proxyClient := proxy.NewClient(store)
	handler := handlers.NewProxyHandler(logger, proxyClient)

	reqBody := `{"service":"nonexistent","method":"GET","path":"/test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(reqBody))
	rec := httptest.NewRecorder()

	handler.Handle(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected status %d, got %d", http.StatusBadGateway, rec.Code)
	}
}

func TestProxyHandler_Handle_POST_WithBody(t *testing.T) {
	// Create mock backend that echoes the request
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write(body)
	}))
	defer backend.Close()

	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: backend.URL,
			},
		},
	}

	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	proxyClient := proxy.NewClient(store)
	handler := handlers.NewProxyHandler(logger, proxyClient)

	reqBody := `{"service":"test-service","method":"POST","path":"/items","body":{"name":"test"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(reqBody))
	rec := httptest.NewRecorder()

	handler.Handle(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	var resp proxy.Response
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected backend status %d, got %d", http.StatusCreated, resp.StatusCode)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body, &body); err != nil {
		t.Fatalf("failed to unmarshal backend response: %v", err)
	}

	if body["name"] != "test" {
		t.Errorf("expected name 'test', got %v", body["name"])
	}
}

func TestProxyHandler_Handle_InvalidMethod(t *testing.T) {
	store := &mockSpecStore{
		configs: map[string]*storage.ServiceConfig{
			"test-service": {
				BaseURL: "http://example.com",
			},
		},
	}

	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	proxyClient := proxy.NewClient(store)
	handler := handlers.NewProxyHandler(logger, proxyClient)

	reqBody := `{"service":"test-service","method":"INVALID","path":"/test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(reqBody))
	rec := httptest.NewRecorder()

	handler.Handle(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected status %d, got %d", http.StatusBadGateway, rec.Code)
	}
}
