package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// ErrServiceNotFound is returned when a service is not found in the store
var ErrServiceNotFound = errors.New("service not found")

// ServiceConfig represents configuration for a backend service
type ServiceConfig struct {
	BaseURL     string            `json:"baseURL"`
	AuthHeaders map[string]string `json:"authHeaders,omitempty"`
}

// SpecStore defines the interface for spec storage
type SpecStore interface {
	// List returns all available service names
	List() ([]string, error)

	// Get returns the OpenAPI spec for a service
	Get(serviceName string) (json.RawMessage, error)

	// GetConfig returns the proxy configuration for a service
	GetConfig(serviceName string) (*ServiceConfig, error)
}

// FileSpecStore implements SpecStore using file system
type FileSpecStore struct {
	specsDir string
	specs    map[string]json.RawMessage // In-memory cache of full specs
	configs  map[string]*ServiceConfig  // In-memory cache of proxy configs
}

// NewFileSpecStore creates a new file-based spec store
// Loads all specs from specsDir into memory on initialization
func NewFileSpecStore(specsDir string) (*FileSpecStore, error) {
	// Check if directory exists
	if _, err := os.Stat(specsDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("specs directory does not exist: %s", specsDir)
	}

	store := &FileSpecStore{
		specsDir: specsDir,
		specs:    make(map[string]json.RawMessage),
		configs:  make(map[string]*ServiceConfig),
	}

	// Load all spec files
	if err := store.loadSpecs(); err != nil {
		return nil, fmt.Errorf("failed to load specs: %w", err)
	}

	return store, nil
}

// loadSpecs loads all *.json files from the specs directory
func (s *FileSpecStore) loadSpecs() error {
	entries, err := os.ReadDir(s.specsDir)
	if err != nil {
		return fmt.Errorf("failed to read directory: %w", err)
	}

	for _, entry := range entries {
		// Skip directories
		if entry.IsDir() {
			continue
		}

		// Only process .json files
		if !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		// Extract service name (filename without .json extension)
		serviceName := strings.TrimSuffix(entry.Name(), ".json")

		// Read file
		filePath := filepath.Join(s.specsDir, entry.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read spec file %s: %w", entry.Name(), err)
		}

		// Parse spec to extract proxy config
		var specDoc map[string]interface{}
		if err := json.Unmarshal(data, &specDoc); err != nil {
			return fmt.Errorf("invalid JSON in spec file %s: %w", entry.Name(), err)
		}

		// Extract x-proxy-config if present
		if proxyConfigRaw, exists := specDoc["x-proxy-config"]; exists {
			configBytes, err := json.Marshal(proxyConfigRaw)
			if err != nil {
				return fmt.Errorf("failed to marshal proxy config from %s: %w", entry.Name(), err)
			}

			var config ServiceConfig
			if err := json.Unmarshal(configBytes, &config); err != nil {
				return fmt.Errorf("invalid proxy config in spec file %s: %w", entry.Name(), err)
			}

			s.configs[serviceName] = &config
		}

		// Store full spec in memory
		s.specs[serviceName] = json.RawMessage(data)
	}

	return nil
}

// List returns sorted list of service names
func (s *FileSpecStore) List() ([]string, error) {
	names := make([]string, 0, len(s.specs))
	for name := range s.specs {
		names = append(names, name)
	}
	sort.Strings(names)
	return names, nil
}

// Get returns the spec for a service, or error if not found
func (s *FileSpecStore) Get(serviceName string) (json.RawMessage, error) {
	spec, exists := s.specs[serviceName]
	if !exists {
		return nil, fmt.Errorf("spec not found for service: %s", serviceName)
	}
	return spec, nil
}

// GetConfig returns the proxy configuration for a service, or error if not found
func (s *FileSpecStore) GetConfig(serviceName string) (*ServiceConfig, error) {
	config, exists := s.configs[serviceName]
	if !exists {
		return nil, fmt.Errorf("config not found for service: %s", serviceName)
	}
	return config, nil
}
