package handlers_test

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"jonathanmcclement.com/playground/internal/handlers"
	"jonathanmcclement.com/playground/internal/storage"
)

// mockSpecStore implements storage.SpecStore for testing
type mockSpecStore struct {
	specs   map[string]json.RawMessage
	configs map[string]*storage.ServiceConfig
}

func (m *mockSpecStore) List() ([]string, error) {
	names := make([]string, 0, len(m.specs))
	for name := range m.specs {
		names = append(names, name)
	}
	return names, nil
}

func (m *mockSpecStore) Get(serviceName string) (json.RawMessage, error) {
	spec, exists := m.specs[serviceName]
	if !exists {
		return nil, storage.ErrServiceNotFound
	}
	return spec, nil
}

func (m *mockSpecStore) GetConfig(serviceName string) (*storage.ServiceConfig, error) {
	config, exists := m.configs[serviceName]
	if !exists {
		return nil, storage.ErrServiceNotFound
	}
	return config, nil
}

func TestSpecsHandler_List(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{
			"service1": json.RawMessage(`{"openapi":"3.0.0"}`),
			"service2": json.RawMessage(`{"openapi":"3.0.0"}`),
		},
	}

	handler := handlers.NewSpecsHandler(logger, store)

	req := httptest.NewRequest(http.MethodGet, "/api/specs", nil)
	rec := httptest.NewRecorder()

	handler.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	var services []string
	if err := json.NewDecoder(rec.Body).Decode(&services); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(services) != 2 {
		t.Errorf("expected 2 services, got %d", len(services))
	}
}

func TestSpecsHandler_List_Empty(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{},
	}

	handler := handlers.NewSpecsHandler(logger, store)

	req := httptest.NewRequest(http.MethodGet, "/api/specs", nil)
	rec := httptest.NewRecorder()

	handler.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	var services []string
	if err := json.NewDecoder(rec.Body).Decode(&services); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(services) != 0 {
		t.Errorf("expected 0 services, got %d", len(services))
	}
}

func TestSpecsHandler_Get(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	testSpec := json.RawMessage(`{"openapi":"3.0.0","info":{"title":"Test API"}}`)
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{
			"test-service": testSpec,
		},
	}

	handler := handlers.NewSpecsHandler(logger, store)

	req := httptest.NewRequest(http.MethodGet, "/api/specs/test-service", nil)
	req.SetPathValue("service", "test-service")
	rec := httptest.NewRecorder()

	handler.Get(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if rec.Header().Get("Content-Type") != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", rec.Header().Get("Content-Type"))
	}

	var spec map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&spec); err != nil {
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

func TestSpecsHandler_Get_NotFound(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{},
	}

	handler := handlers.NewSpecsHandler(logger, store)

	req := httptest.NewRequest(http.MethodGet, "/api/specs/nonexistent", nil)
	req.SetPathValue("service", "nonexistent")
	rec := httptest.NewRecorder()

	handler.Get(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rec.Code)
	}
}

func TestSpecsHandler_Get_NoServiceName(t *testing.T) {
	logger := slog.New(slog.NewJSONHandler(io.Discard, nil))
	store := &mockSpecStore{
		specs: map[string]json.RawMessage{},
	}

	handler := handlers.NewSpecsHandler(logger, store)

	req := httptest.NewRequest(http.MethodGet, "/api/specs/", nil)
	// Don't set PathValue - simulating missing service name
	rec := httptest.NewRecorder()

	handler.Get(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}
}
