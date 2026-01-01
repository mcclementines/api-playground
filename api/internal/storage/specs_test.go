package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestNewFileSpecStore_NonExistentDirectory(t *testing.T) {
	_, err := NewFileSpecStore("/nonexistent/directory")
	if err == nil {
		t.Fatal("expected error for nonexistent directory, got nil")
	}
}

func TestNewFileSpecStore_EmptyDirectory(t *testing.T) {
	tempDir := t.TempDir()

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	names, err := store.List()
	if err != nil {
		t.Fatalf("List() failed: %v", err)
	}

	if len(names) != 0 {
		t.Errorf("expected empty list, got %d items", len(names))
	}
}

func TestNewFileSpecStore_ValidSpecs(t *testing.T) {
	tempDir := t.TempDir()

	// Create test spec files
	ragSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":   "RAG API",
			"version": "1.0.0",
		},
	}
	writeSpecFile(t, tempDir, "rag-api.json", ragSpec)

	searchSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":   "Search API",
			"version": "1.0.0",
		},
	}
	writeSpecFile(t, tempDir, "search-api.json", searchSpec)

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	names, err := store.List()
	if err != nil {
		t.Fatalf("List() failed: %v", err)
	}

	if len(names) != 2 {
		t.Fatalf("expected 2 specs, got %d", len(names))
	}

	// Verify order (should be sorted)
	if names[0] != "rag-api" {
		t.Errorf("expected first spec 'rag-api', got %q", names[0])
	}
	if names[1] != "search-api" {
		t.Errorf("expected second spec 'search-api', got %q", names[1])
	}
}

func TestNewFileSpecStore_InvalidJSON(t *testing.T) {
	tempDir := t.TempDir()

	// Write invalid JSON file
	filePath := filepath.Join(tempDir, "invalid.json")
	if err := os.WriteFile(filePath, []byte("{invalid json}"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	_, err := NewFileSpecStore(tempDir)
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestNewFileSpecStore_IgnoresNonJSONFiles(t *testing.T) {
	tempDir := t.TempDir()

	// Create valid spec
	ragSpec := map[string]interface{}{"openapi": "3.0.0"}
	writeSpecFile(t, tempDir, "rag-api.json", ragSpec)

	// Create non-JSON files
	txtPath := filepath.Join(tempDir, "readme.txt")
	if err := os.WriteFile(txtPath, []byte("some text"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	names, err := store.List()
	if err != nil {
		t.Fatalf("List() failed: %v", err)
	}

	if len(names) != 1 {
		t.Errorf("expected 1 spec (should ignore .txt), got %d", len(names))
	}

	if names[0] != "rag-api" {
		t.Errorf("expected 'rag-api', got %q", names[0])
	}
}

func TestFileSpecStore_Get(t *testing.T) {
	tempDir := t.TempDir()

	ragSpec := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":   "RAG API",
			"version": "1.0.0",
		},
	}
	writeSpecFile(t, tempDir, "rag-api.json", ragSpec)

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	// Test Get for existing spec
	spec, err := store.Get("rag-api")
	if err != nil {
		t.Fatalf("Get('rag-api') failed: %v", err)
	}

	// Verify spec content
	var decoded map[string]interface{}
	if err := json.Unmarshal(spec, &decoded); err != nil {
		t.Fatalf("failed to unmarshal spec: %v", err)
	}

	if decoded["openapi"] != "3.0.0" {
		t.Errorf("expected openapi '3.0.0', got %v", decoded["openapi"])
	}

	// Test Get for non-existent spec
	_, err = store.Get("nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent spec, got nil")
	}
}

func TestFileSpecStore_List_Sorted(t *testing.T) {
	tempDir := t.TempDir()

	// Create specs in non-alphabetical order
	writeSpecFile(t, tempDir, "zebra.json", map[string]interface{}{"test": true})
	writeSpecFile(t, tempDir, "alpha.json", map[string]interface{}{"test": true})
	writeSpecFile(t, tempDir, "beta.json", map[string]interface{}{"test": true})

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	names, err := store.List()
	if err != nil {
		t.Fatalf("List() failed: %v", err)
	}

	expected := []string{"alpha", "beta", "zebra"}
	if len(names) != len(expected) {
		t.Fatalf("expected %d specs, got %d", len(expected), len(names))
	}

	for i, name := range names {
		if name != expected[i] {
			t.Errorf("expected names[%d] = %q, got %q", i, expected[i], name)
		}
	}
}

func TestFileSpecStore_GetConfig(t *testing.T) {
	tempDir := t.TempDir()

	// Create spec with proxy config
	specWithConfig := map[string]interface{}{
		"openapi": "3.0.0",
		"x-proxy-config": map[string]interface{}{
			"baseURL": "https://example.com",
		},
		"info": map[string]interface{}{
			"title": "Test API",
		},
	}
	writeSpecFile(t, tempDir, "test-api.json", specWithConfig)

	// Create spec without proxy config
	specWithoutConfig := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title": "No Config API",
		},
	}
	writeSpecFile(t, tempDir, "no-config.json", specWithoutConfig)

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	// Test GetConfig for spec with config
	config, err := store.GetConfig("test-api")
	if err != nil {
		t.Fatalf("GetConfig('test-api') failed: %v", err)
	}

	if config.BaseURL != "https://example.com" {
		t.Errorf("expected BaseURL 'https://example.com', got %q", config.BaseURL)
	}

	// Test GetConfig for spec without config
	_, err = store.GetConfig("no-config")
	if err == nil {
		t.Fatal("expected error for spec without proxy config, got nil")
	}

	// Test GetConfig for non-existent service
	_, err = store.GetConfig("nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent service, got nil")
	}
}

func TestFileSpecStore_GetConfig_WithAuth(t *testing.T) {
	tempDir := t.TempDir()

	specWithAuth := map[string]interface{}{
		"openapi": "3.0.0",
		"x-proxy-config": map[string]interface{}{
			"baseURL": "https://api.example.com",
			"authHeaders": map[string]interface{}{
				"Authorization": "Bearer token123",
				"X-Api-Key":     "secret",
			},
		},
		"info": map[string]interface{}{
			"title": "Auth API",
		},
	}
	writeSpecFile(t, tempDir, "auth-api.json", specWithAuth)

	store, err := NewFileSpecStore(tempDir)
	if err != nil {
		t.Fatalf("NewFileSpecStore() failed: %v", err)
	}

	config, err := store.GetConfig("auth-api")
	if err != nil {
		t.Fatalf("GetConfig('auth-api') failed: %v", err)
	}

	if config.BaseURL != "https://api.example.com" {
		t.Errorf("expected BaseURL 'https://api.example.com', got %q", config.BaseURL)
	}

	if len(config.AuthHeaders) != 2 {
		t.Fatalf("expected 2 auth headers, got %d", len(config.AuthHeaders))
	}

	if config.AuthHeaders["Authorization"] != "Bearer token123" {
		t.Errorf("expected Authorization 'Bearer token123', got %q", config.AuthHeaders["Authorization"])
	}

	if config.AuthHeaders["X-Api-Key"] != "secret" {
		t.Errorf("expected X-Api-Key 'secret', got %q", config.AuthHeaders["X-Api-Key"])
	}
}

// Helper function to write spec files
func writeSpecFile(t *testing.T, dir, filename string, spec interface{}) {
	t.Helper()

	data, err := json.Marshal(spec)
	if err != nil {
		t.Fatalf("failed to marshal spec: %v", err)
	}

	filePath := filepath.Join(dir, filename)
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		t.Fatalf("failed to write spec file: %v", err)
	}
}
