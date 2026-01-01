package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"jonathanmcclement.com/playground/internal/storage"
)

// SpecsHandler handles spec-related endpoints
type SpecsHandler struct {
	logger *slog.Logger
	store  storage.SpecStore
}

// NewSpecsHandler creates a new specs handler
func NewSpecsHandler(logger *slog.Logger, store storage.SpecStore) *SpecsHandler {
	return &SpecsHandler{
		logger: logger,
		store:  store,
	}
}

// List handles GET /api/specs - returns list of services
func (h *SpecsHandler) List(w http.ResponseWriter, r *http.Request) {
	services, err := h.store.List()
	if err != nil {
		h.logger.Error("failed to list specs", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(services); err != nil {
		h.logger.Error("failed to encode response", "error", err)
	}
}

// Get handles GET /api/specs/{service} - returns OpenAPI spec
func (h *SpecsHandler) Get(w http.ResponseWriter, r *http.Request) {
	serviceName := r.PathValue("service")
	if serviceName == "" {
		http.Error(w, "service name required", http.StatusBadRequest)
		return
	}

	spec, err := h.store.Get(serviceName)
	if err != nil {
		h.logger.Warn("spec not found", "service", serviceName)
		http.Error(w, "spec not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(spec); err != nil {
		h.logger.Error("failed to write response", "error", err)
	}
}
