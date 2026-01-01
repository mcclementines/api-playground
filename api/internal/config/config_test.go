package config

import "testing"

func TestLoadFromEnv_Defaults(t *testing.T) {
	cfg, err := LoadFromEnv()
	if err != nil {
		t.Fatalf("LoadFromEnv() failed: %v", err)
	}

	if cfg.SpecsDir != "./data/specs" {
		t.Errorf("expected default SpecsDir './data/specs', got %q", cfg.SpecsDir)
	}
}

func TestLoadFromEnv_CustomSpecsDir(t *testing.T) {
	t.Setenv("SPECS_DIR", "/custom/path")

	cfg, err := LoadFromEnv()
	if err != nil {
		t.Fatalf("LoadFromEnv() failed: %v", err)
	}

	if cfg.SpecsDir != "/custom/path" {
		t.Errorf("expected SpecsDir '/custom/path', got %q", cfg.SpecsDir)
	}
}
