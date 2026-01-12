package config

import "os"

// Config holds application-level configuration
type Config struct {
	SpecsDir string // Path to specs directory
}

// LoadFromEnv loads configuration from environment variables
// Expected format:
//
//	SPECS_DIR=/path/to/specs (defaults to ./data/specs)
func LoadFromEnv() (*Config, error) {
	cfg := &Config{
		SpecsDir: getEnvOrDefault("SPECS_DIR", "./data/specs"),
	}

	return cfg, nil
}

// getEnvOrDefault returns environment variable value or default
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
